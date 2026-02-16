import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  fileToolsDeclarations,
  fileToolImplementations,
} from "../tools/fileTools";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      tools: [{ functionDeclarations: fileToolsDeclarations }],
      systemInstruction: `Вы — ИИ-архитектор этого веб-сайта. 
Ваша задача — дорабатывать и изменять код проекта по запросу пользователя.
У вас есть доступ к файловой системе через инструменты: read_file, write_file и list_files.
Вы работаете в среде React + Vite + TypeScript.
Когда пользователь просит что-то изменить, вы должны сначала изучить код, а затем внести правки.`,
    });
  }

  async chat(messages: ChatMessage[]) {
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Убеждаемся, что история начинается с user
    const firstUserIndex = history.findIndex((m) => m.role === "user");
    const cleanHistory =
      firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

    const chat = this.model.startChat({
      history: cleanHistory,
    });

    const userMessage = messages[messages.length - 1].content;
    let result = await chat.sendMessage(userMessage);
    let response = result.response;

    // Цикл обработки вызовов функций
    let functionCalls = response.functionCalls();
    while (functionCalls) {
      const responses = await Promise.all(
        functionCalls.map(async (call: any) => {
          const fn = fileToolImplementations[call.name];
          const result = await (fn
            ? fn(call.args)
            : `Function ${call.name} not found`);
          return {
            functionResponse: {
              name: call.name,
              response: { result },
            },
          };
        }),
      );

      result = await chat.sendMessage(responses);
      response = result.response;
      functionCalls = response.functionCalls();
    }

    return response.text();
  }
}
