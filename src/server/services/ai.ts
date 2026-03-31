import { GoogleGenAI, Type } from "@google/genai";
import { CacheService } from "./cache";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class AIService {
  static async analyzeSkills(resumeText: string, targetRole: string) {
    const cacheKey = `analysis:${Buffer.from(resumeText).toString("base64").slice(0, 50)}:${targetRole}`;
    const cached = CacheService.get(cacheKey);
    if (cached) return cached;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: `Analyze this resume for the target role: ${targetRole}. 
      Extract current skills, identify missing skills (gaps), and provide a skill gap report.
      
      Resume:
      ${resumeText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            currentSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            gapReport: { type: Type.STRING },
            matchPercentage: { type: Type.NUMBER },
          },
          required: ["currentSkills", "missingSkills", "gapReport", "matchPercentage"],
        },
      },
    });

    const result = JSON.parse(response.text);
    CacheService.set(cacheKey, result);
    return result;
  }

  static async getCourseRecommendations(missingSkills: string[]) {
    const cacheKey = `courses:${missingSkills.sort().join(",")}`;
    const cached = CacheService.get(cacheKey);
    if (cached) return cached;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: `Provide course recommendations for these missing skills: ${missingSkills.join(", ")}. 
      Include courses from Coursera, Udemy, and YouTube.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              platform: { type: Type.STRING },
              url: { type: Type.STRING },
              skill: { type: Type.STRING },
              isFree: { type: Type.BOOLEAN },
            },
            required: ["title", "platform", "url", "skill", "isFree"],
          },
        },
      },
    });

    const result = JSON.parse(response.text);
    CacheService.set(cacheKey, result);
    return result;
  }

  static async generateRoadmap(missingSkills: string[], targetRole: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: `Generate a personalized learning roadmap for a ${targetRole} role, focusing on these missing skills: ${missingSkills.join(", ")}. 
      Break it down into phases (weeks or months).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phase: { type: Type.STRING },
              topics: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING },
            },
            required: ["phase", "topics", "description"],
          },
        },
      },
    });

    return JSON.parse(response.text);
  }

  static async generateMockQuestions(role: string, level: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: `Generate 5 mock interview questions for a ${level} ${role} role.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ["question", "category"],
          },
        },
      },
    });

    return JSON.parse(response.text);
  }

  static async evaluateResponse(question: string, userResponse: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: `Evaluate this interview response.
      Question: ${question}
      Response: ${userResponse}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["score", "feedback", "suggestions"],
        },
      },
    });

    return JSON.parse(response.text);
  }
}
