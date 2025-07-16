import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const generateAiResponse = async (code) => {
   
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `${code}`,
        instructions: "I have made code reviewer for my compiler. Please review the code and provide feedback on its correctness, efficiency, and any potential improvements.",
      });
  
      const response =  result.text;
      return response;

    } catch (error) {
      console.error('Gemini API error:', error.message);
      throw new Error('Failed to get AI feedback');
    }
  };


export default generateAiResponse;