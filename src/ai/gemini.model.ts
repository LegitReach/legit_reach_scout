import {GenerativeModel, GoogleGenerativeAI} from '@google/generative-ai'



export function getGeminiModel(model_name:string = 'gemini-2.5-flash'):GenerativeModel{
    const ai = new GoogleGenerativeAI('AIzaSyC0TeX6AN7szRr8Y3hl8_j_OybrLH4TZNg');

    const model = ai.getGenerativeModel({
        model: model_name,
        generationConfig: { responseMimeType: "application/json" }
    })

    return model;
}
        
