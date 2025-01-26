import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { submitQuestion } from "@/lib/langgraph";
import { ChatRequestBody, SSE_DATA_PREFIX, SSE_LINE_DELIMITER, StreamMessage, StreamMessageType } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { error } from "console";
import { NextResponse } from "next/server";

export async function POST(req: Request){

    function sendSSEMessage(
        writer: WritableStreamDefaultWriter<Uint8Array>,
        data: StreamMessage
      ) {
        const encoder = new TextEncoder();
        return writer.write(
          encoder.encode(
            `${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`
          )
        );
      }
    try {
        const { userId } = await auth()
        if(!userId){
            throw new Response("Unauthorized", { status: 401 });
        }
        const body = (await req.json()) as ChatRequestBody
        const { messages, newMessage, chatId } = body

        const convex = getConvexClient()

        // Create stream with larger queue strategy for better performance
        const stream = new TransformStream( {}, { highWaterMark: 1024 });
        const writer = stream.writable.getWriter()

        const response = new Response(stream.readable, {
            headers: {
              "Content-Type": "text/event-stream",
              Connection: "keep-alive",
              "X-Accel-Buffering": "no", // Disable buffering for nginx which is required for SSE to work properly
            },
          }); 

        const startStream = async () =>{
            try {
                
                await sendSSEMessage(writer, { type: StreamMessageType.Connected });

                // Send user messge to Convex
                await convex.mutation(api.messages.send,{
                    chatId,
                    content: newMessage,
                })

                //convert messages to Langchain format
                const langChainMessages = [
                  ...messages.map((msg) =>
                    msg.role === 'user'
                      ? new HumanMessage(msg.content) 
                      : new AIMessage(msg.content)
                  ),
                  new HumanMessage(newMessage)
                ]

                try {
                  //create the event stream
                  const eventStream = await submitQuestion(langChainMessages, chatId);

                  // Process the events
                  for await (const event of eventStream) {
                    // console.log("🔄 Event:", event);
        
                    // if (event.event === "on_chat_model_stream") {
                    //   const token = event.data.chunk;
                    //   if (token) {
                    //     // Access the text property from the AIMessageChunk
                    //     const text = token.content.at(0)?.["text"];
                    //     if (text) {
                    //       await sendSSEMessage(writer, {
                    //         type: StreamMessageType.Token,
                    //         token: text,
                    //       });
                    //     }
                    //   }
                    // } 
                    if (event.event === "on_chat_model_stream") {
                      const chunk = event.data.chunk;
                      if (chunk?.content) {
                        const text = Array.isArray(chunk.content) 
                          ? chunk.content.map((c: { text: any; }) => c.text).join('')
                          : chunk.content;
                        
                        if (text) {
                          await sendSSEMessage(writer, {
                            type: StreamMessageType.Token,
                            token: text
                          });
                        }
                      }
                    }
                    // else if (event.event === "on_tool_start") {
                    //   await sendSSEMessage(writer, {
                    //     type: StreamMessageType.ToolStart,
                    //     tool: event.name || "unknown",
                    //     input: event.data.input,
                    //   });
                    // } 
                    else if (event.event === "on_tool_start") {
                      // Gemini uses different event structure
                      const toolCall = (event.data as any).toolCall || 
                                      (event.data.input?.tool_calls?.[0]);
                      
                      if (toolCall) {
                          await sendSSEMessage(writer, {
                              type: StreamMessageType.ToolStart,
                              tool: toolCall.name || toolCall.function?.name,
                              input: toolCall.args || JSON.parse(toolCall.function?.arguments || "{}")
                          });
                      }
                  }
                    else if (event.event === "on_tool_end") {
                      const toolMessage = new ToolMessage(event.data.output);
                      console.log(toolMessage)
        
                      await sendSSEMessage(writer, {
                        type: StreamMessageType.ToolEnd,
                        tool: toolMessage.lc_kwargs.name || "unknown",
                        output: event.data.output,
                      });
                    }
                  }
        
                  // Send completion message without storing the response
                  await sendSSEMessage(writer, { type: StreamMessageType.Done });
                } catch (streamError) {
                  console.error("Error in event stream", streamError)
                  await sendSSEMessage(writer, {
                    type: StreamMessageType.Error,
                    error: streamError instanceof Error 
                    ? streamError.message 
                    : "Stream processing failed"
                  })
                }
            } catch (error) {
              console.error("Error in event stream", error)
              await sendSSEMessage(writer, {
                type: StreamMessageType.Error,
                error: error instanceof Error 
                ? error.message 
                : "Unknown error"
              })
            } finally{
              try {
                await writer.close()
              } catch (closeError) {
                console.error("Error closing the writer", closeError)
                
              }
            }
        }
        startStream();
        return response;
    } catch (error) {
        console.error("Error in Chat API: ", error)
        return NextResponse.json(
            { error: "Failed to process chat request" } as const,
            { status: 500 }
        )
    }
}