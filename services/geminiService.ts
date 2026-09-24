import { GoogleGenAI, Type } from "@google/genai";
import { groundingService } from "./groundingService";
import { GroundingResult } from "../types";

export class GeminiService {
  private getClient() {
    // Re-instantiate per call to ensure we pick up the latest key from aistudio bridge
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async evaluateSkills(selections: { category: string, question: string, choice: string }[]) {
    const ai = this.getClient();
    const dataString = selections.map(s => `[${s.category}] Q: ${s.question} A: ${s.choice}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are a high-level psychometric analyzer for elite university admissions.
      Analyze these 12 instinctive cognitive choices. 
      Generate 6 normalized scores (0-100). 
      
      SCORING RULES:
      1. CRITICAL: Do NOT return average scores (near 50) for all categories.
      2. If choices lean towards one extreme, reward that category with 85-98.
      3. Create a unique "Cognitive Signature". Identify if the user is a "Specialist" (one high spike) or a "Multipotentialite".
      4. Variance is mandatory. Ensure results feel "earned" and specific.
      
      User Data:
      ${dataString}`,
      config: {
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analytical: { type: Type.NUMBER },
            creative: { type: Type.NUMBER },
            leadership: { type: Type.NUMBER },
            social: { type: Type.NUMBER },
            resilience: { type: Type.NUMBER },
            vision: { type: Type.NUMBER },
          },
          required: ["analytical", "creative", "leadership", "social", "resilience", "vision"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }

  async getEssayFeedback(essay: string, targetUni: string) {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Review the following admission essay for ${targetUni}. Provide feedback in JSON format.
      Essay: "${essay}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Overall score out of 100" },
            grammar: { type: Type.STRING },
            narrative: { type: Type.STRING },
            strategicFit: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["score", "grammar", "narrative", "strategicFit", "suggestions"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }

  async generateEssayDraft(universityName: string, selectedFacts: string[], userProfile: string, skills: any) {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Draft a professional motivational essay paragraph for ${universityName}. 
      User Profile: "${userProfile}".
      Measured Skills (0-100): Analytical: ${skills.analytical}, Creative: ${skills.creative}, Leadership: ${skills.leadership}, Vision: ${skills.vision}.
      Facts to weave in: ${selectedFacts.join(', ')}.`,
      config: { temperature: 0.8 }
    });
    return response.text;
  }

  /**
   * Google Search Grounding with gemini-3.5-flash
   */
  async searchGrounding(query: string, context?: { universityName?: string; location?: string }): Promise<GroundingResult> {
    return groundingService.fetchSearchGroundedData(query, context);
  }

  /**
   * Google Maps Grounding with gemini-3.5-flash
   */
  async mapsGrounding(
    query: string,
    options?: {
      universityId?: string;
      universityName?: string;
      location?: string;
      userCoordinates?: { latitude: number; longitude: number };
    }
  ): Promise<GroundingResult> {
    return groundingService.fetchMapsGroundedData(query, options);
  }
}

export const geminiService = new GeminiService();