import ChatInterface from "@/components/ChatInterface";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel"
import { getConvexClient } from "@/lib/convex";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface ChatPageProps{
    params: Promise<{
        chatId: Id<"chats">
    }>
}
async function ChatPage({ params }: ChatPageProps) {
    const { chatId } = await params;

    const { userId } = await auth();

    if(!userId){
        redirect("/")
    }

    try {
        const convex = getConvexClient();
    
        const initaialMessage = await convex.query(api.messages.list, { chatId })
      return (
        <div className="flex-1 overflow-hidden">
            <ChatInterface chatId={chatId} initialMessage= {initaialMessage} />
        </div>
      )
        
    } catch (error) {
        console.error("Error loading the chat", error);
        redirect('/')
    }

}

export default ChatPage