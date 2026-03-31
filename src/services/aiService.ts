import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const analyzeResume = async (resumeText: string, targetRole: string) => {
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: `Analyze this resume for the target role: ${targetRole}. 
    Resume Text: ${resumeText}`,
    config: {
      systemInstruction: "You are a career expert. Analyze the resume against the target role. Identify strengths, weaknesses, and missing skills. Generate a detailed skill gap report and a learning roadmap.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingSkills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skill: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                    reason: { type: Type.STRING },
                    resources: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          platform: { type: Type.STRING },
                          type: { type: Type.STRING, enum: ["Free", "Paid"] },
                          url: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          roadmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                level: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                estimatedTime: { type: Type.STRING },
                dailyGoals: { type: Type.ARRAY, items: { type: Type.STRING } },
                projects: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        },
        required: ["analysis", "roadmap"]
      }
    }
  });

  let text = result.text;
  if (!text || text === "undefined") {
    throw new Error("AI returned an empty or undefined response for resume analysis.");
  }
  text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse resume analysis JSON:", text);
    throw new Error("Invalid JSON format in AI response for resume analysis");
  }
};

export const generateInterviewQuestions = async (role: string, analysis: any) => {
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: `Generate 5 interview questions for the role: ${role}. 
    Focus on these weaknesses: ${JSON.stringify(analysis.weaknesses)} and missing skills: ${JSON.stringify(analysis.missingSkills.map((s: any) => s.skill))}`,
    config: {
      systemInstruction: "You are a senior interviewer. Generate challenging but fair interview questions based on the user's profile.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            category: { type: Type.STRING },
            difficulty: { type: Type.STRING }
          },
          required: ["id", "question", "category", "difficulty"]
        }
      }
    }
  });

  let text = result.text;
  if (!text || text === "undefined") {
    throw new Error("AI returned an empty or undefined response for interview questions.");
  }
  text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse interview questions JSON:", text);
    throw new Error("Invalid JSON format in AI response for interview questions");
  }
};

export const generateRoadmapForRole = async (role: string) => {
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: `Generate a comprehensive learning roadmap for the role: ${role}. 
    Since no resume is provided, assume a beginner starting from scratch but aiming for professional proficiency.`,
    config: {
      systemInstruction: "You are a career expert. Generate a detailed step-by-step learning roadmap for the given role. Include levels (Beginner, Intermediate, Advanced), daily goals, and projects. Provide a general analysis of what this role entails.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingSkills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skill: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                    reason: { type: Type.STRING },
                    resources: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          platform: { type: Type.STRING },
                          type: { type: Type.STRING, enum: ["Free", "Paid"] },
                          url: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          roadmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                level: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                estimatedTime: { type: Type.STRING },
                dailyGoals: { type: Type.ARRAY, items: { type: Type.STRING } },
                projects: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        },
        required: ["analysis", "roadmap"]
      }
    }
  });

  let text = result.text;
  if (!text || text === "undefined") {
    throw new Error("AI returned an empty or undefined response for role roadmap.");
  }
  text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse role roadmap JSON:", text);
    throw new Error("Invalid JSON format in AI response for role roadmap");
  }
};

export const evaluateAnswer = async (question: string, answer: string) => {
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: `Question: ${question}\nAnswer: ${answer}`,
    config: {
      systemInstruction: "Evaluate the user's interview answer. Provide feedback on correctness, confidence, and improvement tips.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Score from 0 to 10" },
          feedback: { type: Type.STRING },
          improvementTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          idealAnswer: { type: Type.STRING }
        },
        required: ["score", "feedback", "improvementTips", "idealAnswer"]
      }
    }
  });

  let text = result.text;
  if (!text || text === "undefined") {
    throw new Error("AI returned an empty or undefined response for answer evaluation.");
  }
  text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse answer evaluation JSON:", text);
    throw new Error("Invalid JSON format in AI response for answer evaluation");
  }
};

export const startInterviewChat = async (
  role: string, 
  analysis: any, 
  language: string = "General",
  feedbackPreferences: string[] = []
) => {
  const feedbackPrompt = feedbackPreferences.length > 0 
    ? `The candidate has specifically requested feedback on: ${feedbackPreferences.join(", ")}.` 
    : "Provide general feedback on clarity, conciseness, and relevance to the role.";

  const chat = ai.chats.create({
    model: "gemini-2.0-flash-lite",
    config: {
      systemInstruction: `You are a senior technical interviewer for the role of ${role}. 
      The candidate has the following profile analysis: ${JSON.stringify(analysis)}.
      Preferred programming language for technical questions: ${language}.
      Your goal is to conduct a dynamic, conversational mock interview.
      
      ${feedbackPrompt}
      
      1. Start by introducing yourself and asking the first question.
      2. Focus on the candidate's skill gaps and weaknesses identified in the analysis.
      3. After each response, provide detailed feedback covering:
         - Clarity: How clear was the explanation?
         - Conciseness: Was it to the point or too wordy?
         - Relevance: How well did it address the role's requirements?
         ${feedbackPreferences.includes("Technical Depth") ? "- Technical Depth: Did they show deep understanding of the concepts?" : ""}
         ${feedbackPreferences.includes("Behavioral Aspects") ? "- Behavioral Aspects: How was their communication style and soft skills?" : ""}
      4. Ask follow-up questions based on their answers to dig deeper.
      5. Keep the tone professional but encouraging.
      6. If the candidate asks for feedback or how they are doing, provide real-time constructive criticism.
      7. Aim for about 5-8 questions in total before concluding with a summary.`,
    },
  });

  const response = await chat.sendMessage({ message: "Let's start the interview. Please introduce yourself and ask the first question." });
  return { chat, initialMessage: response.text };
};
