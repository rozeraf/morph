export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIService {
  chat(messages: ChatMessage[]): Promise<string>;
}
