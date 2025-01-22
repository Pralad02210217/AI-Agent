import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { ChatRequestBody, SSE_DATA_PREFIX, SSE_LINE_DELIMITER, StreamMessage, StreamMessageType } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
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
            } catch (error) {
               console.error('Error in chat API:',error)
               return NextResponse.json(
                { error: "Failed to process chat request"} as const,
                { status: 500 }
               ) 
            }
        }
        startStream();

    } catch (error) {
        console.error("Error in Chat API: ", error)
        return NextResponse.json(
            { error: "Failed to process chat request" } as const,
            { status: 500 }
        )
    }
}