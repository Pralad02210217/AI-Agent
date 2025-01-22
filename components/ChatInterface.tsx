'use client'

import { Doc, Id } from "@/convex/_generated/dataModel"
import { FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { ChatRequestBody } from "@/lib/types";

interface ChatInterfaceProps  {
    chatId: Id<"chats">
    initialMessage: Doc<'messages'>[];

}

function ChatInterface({ chatId, initialMessage}: ChatInterfaceProps) {
    const [messages, setMessages] =useState<Doc<"messages">[]>(initialMessage);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false)
    const [streamedResponse, setStreamedResponse] = useState("")
    const [currentTool, setCurrentTool] = useState<{
        name: string;
        input: unknown;
    }| null >(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() =>{
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'});
    },[messages, streamedResponse])

    const handleSumit = async (e: React.FormEvent)=>{
        e.preventDefault();

        const trimmedInput = input.trim();
        if(!trimmedInput || isLoading) return;

        //reset UI state for new message
        setInput("");
        setStreamedResponse("");
        setCurrentTool(null);
        setIsLoading(true)

        const optimisticUserMessage: Doc<"messages"> = {
            _id: `temp_${Date.now()}`,
            chatId,
            content: trimmedInput,
            role: "user",
            createdAt: Date.now()
        } as Doc<"messages">

        setMessages((prev) => [...prev, optimisticUserMessage])

        let fullResponse = "";

        try {
            const requestBody: ChatRequestBody = {
                messages: messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content
                })),
                newMessage: trimmedInput,
                chatId
            };

            //initialize SSE connection
            const response = await fetch("/api/chat/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
              });
        
              if (!response.ok) throw new Error(await response.text());
              if (!response.body) throw new Error("No response body available");

        } catch (error) {
              // Handle any errors during streaming
            console.error("Error sending message:", error);
            // Remove the optimistic user message if there was an error
            setMessages((prev) =>
                prev.filter((msg) => msg._id !== optimisticUserMessage._id)
            );
            setStreamedResponse(
                "error"
                // formatTerminalOutput(
                //   "error",
                //   "Failed to process message",
                //   error instanceof Error ? error.message : "Unknown error"
                // )
            );
        } finally{
            setIsLoading(false)
        }
    }
  return (
    <main className="flex flex-col h-[calc(100vh-theme(spacing.14))]">
        <section className="flex-1">    
            <div>
                {messages.map((message) =>(
                    <div key={message._id}>{message.content}</div>
                ))}
                <div ref={messagesEndRef}/>
            </div>
        </section>
        <footer className="border-t bg-white p-4">
            <form onSubmit={handleSumit} className="max-w-4xl mx-auto relative">
            <div className="relative flex items-center">
                <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message AI Agent..."
                className="flex-1 py-3 px-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 bg-gray-50 placeholder:text-gray-500"
                disabled={isLoading}
                />
                <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`absolute right-1.5 rounded-xl h-9 w-9 p-0 flex items-center justify-center transition-all ${
                    input.trim()
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    : "bg-gray-100 text-gray-400"
                }`}
                >
                <ArrowRight />
                </Button>
            </div>
            </form>
        </footer>
    </main>
  )
}

export default ChatInterface