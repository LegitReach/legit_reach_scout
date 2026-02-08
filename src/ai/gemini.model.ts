import {GenerativeModel, GoogleGenerativeAI} from '@google/generative-ai'



export function getGeminiModel(model_name:string = 'gemini-2.5-flash'):GenerativeModel{
    const ai = new GoogleGenerativeAI('***REMOVED***');

    const model = ai.getGenerativeModel({
        model: model_name,
        generationConfig: { responseMimeType: "application/json" }
    })

    return model;
}
        
