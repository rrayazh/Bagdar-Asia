import { aiService } from './aiService';
import { groundingService } from './groundingService';

export const geminiService = {
  evaluateSkills: aiService.evaluateSkills.bind(aiService),
  getEssayFeedback: aiService.getEssayFeedback.bind(aiService),
  generateEssayDraft: aiService.generateEssayDraft.bind(aiService),
  searchGrounding: groundingService.fetchSearchGroundedData.bind(groundingService),
  mapsGrounding: groundingService.fetchMapsGroundedData.bind(groundingService),
};
