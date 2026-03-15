import {
  GenerativeModel,
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { Tool } from "@google/generative-ai/server";

export function getGeminiModel(
  model_name: string = "gemini-2.5-flash",
): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  const ai = new GoogleGenerativeAI(apiKey);

  const model = ai.getGenerativeModel({
    model: model_name,
    generationConfig: { responseMimeType: "application/json" },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
    ],
  });

  return model;
}
