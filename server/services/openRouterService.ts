import OpenAI from "openai";
import {
  openAiFileToolsDeclarations,
  fileToolImplementations,
} from "../tools/fileTools";
import { ChatMessage, AIService } from "../types";

export class OpenRouterService implements AIService {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = "google/gemini-2.0-flash-001") {
    this.openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Morph AI Architect",
      },
    });
    this.model = model;
  }

  async chat(messages: ChatMessage[]) {
    const apiMessages: any[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add system instruction as the first message if not present
    apiMessages.unshift({
      role: "system",
      content: `Вы — ИИ-архитектор этого веб-сайта. 
Ваша задача — дорабатывать и изменять код проекта по запросу пользователя.
У вас есть доступ к файловой системе через инструменты: read_file, write_file и list_files.
Вы работаете в среде React + Vite + TypeScript.
Когда пользователь просит что-то изменить, вы должны сначала изучить код, а затем внести правки.`,
    });

    let response = await this.openai.chat.completions.create({
      model: this.model,
      messages: apiMessages,
      tools: openAiFileToolsDeclarations,
    });

    let message = response.choices[0].message;

    while (message.tool_calls && message.tool_calls.length > 0) {
      apiMessages.push(message);

      for (const toolCall of message.tool_calls) {
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        const fn = fileToolImplementations[name];
        
        const result = await (fn
          ? fn(args)
          : `Function ${name} not found`);

        apiMessages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: name,
          content: typeof result === 'string' ? result : JSON.stringify(result),
        });
      }

      response = await this.openai.chat.completions.create({
        model: this.model,
        messages: apiMessages,
        tools: openAiFileToolsDeclarations,
      });
      message = response.choices[0].message;
    }

    return message.content || "";
  }
}
