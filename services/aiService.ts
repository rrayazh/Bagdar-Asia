import { responseLanguage, type Locale } from '../i18n/locale';

import type { EssayFeedback } from '../types';

type Feature = 'essay_feedback' | 'essay_draft' | 'campus_simulation' | 'skills';

class AiService {
  private async callAi(feature: Feature, prompt: string, locale: Locale = 'en') {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feature, prompt, locale })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "AI request failed");
    }

    const data = await response.json();
    return data.text as string;
  }

  async evaluateSkills(selections: { category: string, question: string, choice: string }[]) {
    const dataString = selections.map(s => `[${s.category}] Q: ${s.question} A: ${s.choice}`).join('\n');
    const prompt = `You are a high-level psychometric analyzer for elite university admissions.
      Analyze these 12 instinctive cognitive choices. Generate 6 normalized scores (0-100). 
      Return ONLY a JSON object with keys: analytical, creative, leadership, social, resilience, vision.
      
      SCORING RULES:
      1. Variance is mandatory. Ensure results feel specific.
      2. If choices lean towards one extreme, reward that category with 85-98.
      
      User Data:
      ${dataString}`;

    return JSON.parse(await this.callAi('skills', prompt));
  }

  async getEssayFeedback(essay: string, targetUni: string, locale: Locale = 'en') {
    const prompt = `Review the following admission essay for ${targetUni}. Provide feedback in JSON format with keys: score (number 0-100), grammar (string), narrative (string), strategicFit (string), suggestions (array of strings). Write the feedback in ${responseLanguage[locale]}, keeping the JSON keys unchanged.
      Essay: "${essay}"`;

    const feedback: Partial<EssayFeedback> | null = JSON.parse(await this.callAi('essay_feedback', prompt, locale));
    if (!feedback || typeof feedback.score !== 'number' || feedback.score < 0 || feedback.score > 100 ||
        typeof feedback.grammar !== 'string' || typeof feedback.narrative !== 'string' ||
        typeof feedback.strategicFit !== 'string' || !Array.isArray(feedback.suggestions) ||
        !feedback.suggestions.every(item => typeof item === 'string')) {
      throw new Error('AI provider request failed');
    }
    return feedback as EssayFeedback;
  }

  async generateEssayDraft(universityName: string, selectedFacts: string[], userProfile: string, skills: any, locale: Locale = 'en') {
    const prompt = `Draft a professional motivational essay paragraph for ${universityName}. 
      User Profile: "${userProfile}".
      Measured Skills (0-100): Analytical: ${skills.analytical}, Creative: ${skills.creative}, Leadership: ${skills.leadership}, Vision: ${skills.vision}.
      Write the draft in ${responseLanguage[locale]}. Facts to weave in: ${selectedFacts.join(', ')}.`;

    return this.callAi('essay_draft', prompt, locale);
  }
  summarizeCampusDay(prompt: string, locale: Locale) {
    return this.callAi('campus_simulation', prompt, locale);
  }
}

export const aiService = new AiService();
