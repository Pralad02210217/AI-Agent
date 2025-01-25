import {
    SSE_DONE_MESSAGE,
    StreamMessageType,
    SSE_DATA_PREFIX,
    StreamMessage,
  } from "./types";
  
  /**
   * Creates a parser for Server-Sent Events (SSE) streams.
   * SSE allows real-time updates from server to client.
   */
  export const createSSEParser = () => {
    let buffer = "";
  
    const parse = (chunk: string): StreamMessage[] => {
      // Combine buffer with new chunk and split into lines
      const lines = (buffer + chunk).split("\n");
      // Save last potentially incomplete line
      buffer = lines.pop() || "";
  
      return lines
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith(SSE_DATA_PREFIX)) return null;
  
          const data = trimmed.substring(SSE_DATA_PREFIX.length);
          if (data === SSE_DONE_MESSAGE) return { type: StreamMessageType.Done };
  
          try {
            const parsed = JSON.parse(data) as StreamMessage;
            return Object.values(StreamMessageType).includes(parsed.type)
              ? parsed
              : null;
          } catch {
            return {
              type: StreamMessageType.Error,
              error: "Failed to parse SSE message",
            };
          }
        })
        .filter((msg): msg is StreamMessage => msg !== null);
    };
  
    return { parse };
  };