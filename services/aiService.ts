export type AiProvider = 'gemini' | 'openai';

export class AiService {
  private provider: AiProvider = (localStorage.getItem('ai_provider') as AiProvider) || 'openai';

  constructor() {
    // Ensure the default provider is saved if it's the first run
    if (!localStorage.getItem('ai_provider')) {
      localStorage.setItem('ai_provider', 'openai');
    }
  }

  setProvider(p: AiProvider) {
    this.provider = p;
    localStorage.setItem('ai_provider', p);
  }

  private async callAi(prompt: string, jsonMode: boolean = false) {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, jsonMode, provider: this.provider })
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

    return JSON.parse(await this.callAi(prompt, true));
  }

  async getEssayFeedback(essay: string, targetUni: string) {
    const prompt = `Review the following admission essay for ${targetUni}. Provide feedback in JSON format with keys: score (number 0-100), grammar (string), narrative (string), strategicFit (string), suggestions (array of strings).
      Essay: "${essay}"`;

    return JSON.parse(await this.callAi(prompt, true));
  }

  async generateEssayDraft(universityName: string, selectedFacts: string[], userProfile: string, skills: any) {
    const prompt = `Draft a professional motivational essay paragraph for ${universityName}. 
      User Profile: "${userProfile}".
      Measured Skills (0-100): Analytical: ${skills.analytical}, Creative: ${skills.creative}, Leadership: ${skills.leadership}, Vision: ${skills.vision}.
      Facts to weave in: ${selectedFacts.join(', ')}.`;

    return await this.callAi(prompt);
  }
}

export const aiService = new AiService();
