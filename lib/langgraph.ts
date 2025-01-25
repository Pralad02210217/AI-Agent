import { ChatAnthropic } from "@langchain/anthropic"
import { ToolNode } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";
import {
    END,
    MessagesAnnotation,
    START,
    StateGraph,
  } from "@langchain/langgraph";
import SYSTEM_MESSAGE from "@/constants/systemMessage";
import {
    ChatPromptTemplate,
    MessagesPlaceholder,
  } from "@langchain/core/prompts";
import { SystemMessage } from "@langchain/core/messages";


//Customers at: https://introspection.apis.stepzen.com/customers
// Commetents at: https://dummyjson.com/comments

// Connect to wxflows
const toolClient = new wxflows({
    endpoint: process.env.WXFLOWS_ENDPOINT || "",
    apikey: process.env.WXFLOWS_APIKEY,
  });
  
  // Retrieve the tools
  const tools = await toolClient.lcTools;
  const toolNode = new ToolNode(tools)

const initialiseModel = () => {
    const model = new ChatAnthropic({
      modelName: "claude-3-5-sonnet-20241022",
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.7,
      maxTokens: 4000,
      streaming: true,
      clientOptions: {
        defaultHeaders: {
          "anthropic-beta": "prompt-caching-2024-07-31",
        },
      },
      callbacks: [
        {
          handleLLMStart: async () => {
            // console.log("🤖 Starting LLM call");
          },
          handleLLMEnd: async (output) => {
            console.log("🤖 End LLM call", output);
            const usage = output.llmOutput?.usage;
            if (usage) {
              // console.log("📊 Token Usage:", {
              //   input_tokens: usage.input_tokens,
              //   output_tokens: usage.output_tokens,
              //   total_tokens: usage.input_tokens + usage.output_tokens,
              //   cache_creation_input_tokens:
              //     usage.cache_creation_input_tokens || 0,
              //   cache_read_input_tokens: usage.cache_read_input_tokens || 0,
              // });
            }
          },
          // handleLLMNewToken: async (token: string) => {
          //   // console.log("🔤 New token:", token);
          // },
        },
      ],
    }).bindTools(tools);
  
    return model;
  };

const createWorkflow = () =>{
    const model = initialiseModel()
    const stateGraph = new StateGraph(MessagesAnnotation).addNode(
        "agent",
        async (state) =>{
            const systemContent = SYSTEM_MESSAGE
        }
    )

    
      // Create the prompt template with system message and messages placeholder
      const systemContent = SYSTEM_MESSAGE
      const promptTemplate = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemContent, {
          cache_control: { type: "ephemeral" },
        }),
        new MessagesPlaceholder("messages"),
      ]);
}