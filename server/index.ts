import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { GeminiService } from './services/geminiService';
import { OpenRouterService } from './services/openRouterService';
import { AIService } from './types';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const provider = process.env.AI_PROVIDER || 'gemini';
let aiService: AIService;

if (provider === 'openrouter') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';
  if (!apiKey) {
    console.error("FATAL: OPENROUTER_API_KEY is not set in .env");
    process.exit(1);
  }
  aiService = new OpenRouterService(apiKey, model);
  console.log(`Using OpenRouter with model ${model}`);
} else {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("FATAL: GEMINI_API_KEY is not set in .env");
    process.exit(1);
  }
  aiService = new GeminiService(apiKey);
  console.log("Using Gemini service");
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const reply = await aiService.chat(messages);
    res.json({ content: reply });
  } catch (error: any) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 AI Backend running at http://localhost:${port}`);
});
