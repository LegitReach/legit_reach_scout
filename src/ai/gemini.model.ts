import {GenerativeModel, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory} from '@google/generative-ai'
import { Tool } from '@google/generative-ai/server';



export function getGeminiModel(model_name:string = 'gemini-2.5-flash', ):GenerativeModel{
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI API KEY  is not set');
    }
    const ai = new GoogleGenerativeAI(apiKey);

    const model = ai.getGenerativeModel({
        model: model_name,
        generationConfig: { responseMimeType: "application/json" },
        safetySettings: [
            {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,            
            }
        ]
    })

    return model;
}
        
