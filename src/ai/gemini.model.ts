import {GenerativeModel, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory} from '@google/generative-ai'
import { Tool } from '@google/generative-ai/server';



export function getGeminiModel(model_name:string = 'gemini-2.5-flash', ):GenerativeModel{
    const ai = new GoogleGenerativeAI('AIzaSyC0TeX6AN7szRr8Y3hl8_j_OybrLH4TZNg');

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
        
