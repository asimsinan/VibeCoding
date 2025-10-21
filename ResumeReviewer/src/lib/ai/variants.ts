import { VariantResponseSchema, VariantResponse, ResumeVariant } from './schemas';
import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const genAI = new GoogleGenAI({});

export interface VariantContext {
  targetRole?: string;
  industry?: string;
  seniority?: 'entry' | 'mid' | 'senior' | 'executive';
  jobDescription?: string;
  focusAreas?: string[];
}

export async function generateResumeVariants(
  resumeContent: string,
  context: VariantContext
): Promise<VariantResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = `You are an expert resume strategist. Generate multiple variants of key resume sections and then rank them using a tournament-style system.

CONTEXT:
- Target Role: ${context.targetRole || 'Not specified'}
- Industry: ${context.industry || 'Not specified'}
- Seniority: ${context.seniority || 'Not specified'}
${context.jobDescription ? `- Job Description: ${context.jobDescription}` : ''}
${context.focusAreas ? `- Focus Areas: ${context.focusAreas.join(', ')}` : ''}

RESUME CONTENT:
${resumeContent}

Generate variants and return STRICT JSON matching this schema:

{
  "variants": [
    {
      "id": "unique-id",
      "type": "headline|summary|skills|experience",
      "content": "variant content",
      "rationale": "why this variant works"
    }
  ],
  "tournament": {
    "ranking": [
      {
        "id": "variant-id",
        "score": 0-100,
        "reasons": ["reason 1", "reason 2"]
      }
    ],
    "winner": {
      "id": "best-variant-id",
      "score": 0-100
    },
    "improvements": [
      {
        "variantId": "variant-id",
        "changes": ["specific improvement 1", "specific improvement 2"]
      }
    ]
  }
}

VARIANT GENERATION RULES:
1. Create 3-5 variants for each section type (headline, summary, skills, experience)
2. Each variant should target different strengths or approaches
3. Consider ATS optimization, recruiter appeal, and industry standards
4. Provide clear rationale for each variant

TOURNAMENT RANKING CRITERIA:
- ATS Compatibility (40%): Keyword density, formatting, syntax
- Clarity & Impact (30%): Readability, quantified achievements, action verbs
- Role Alignment (30%): Relevance to target role, industry fit, seniority match

Return ONLY the JSON object. No markdown, no explanations.`;

  try {
    const response = await genAI.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3, // Slightly higher for creativity in variants
        systemInstruction: 'You are an expert resume strategist. Always respond with valid JSON matching the exact schema provided.'
      }
    });

    if (!response.text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(response.text);
    const validated = VariantResponseSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error('Gemini variant generation failed:', error);
    throw new Error(`Gemini variant generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateSpecificVariants(
  sectionType: 'headline' | 'summary' | 'skills' | 'experience',
  originalContent: string,
  context: VariantContext
): Promise<ResumeVariant[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = `Generate 5 different variants for the ${sectionType} section of a resume.

CONTEXT:
- Target Role: ${context.targetRole || 'Not specified'}
- Industry: ${context.industry || 'Not specified'}
- Seniority: ${context.seniority || 'Not specified'}

ORIGINAL ${sectionType.toUpperCase()}:
${originalContent}

Return STRICT JSON array:
[
  {
    "id": "variant-1",
    "type": "${sectionType}",
    "content": "variant content",
    "rationale": "why this works"
  },
  {
    "id": "variant-2",
    "type": "${sectionType}",
    "content": "variant content",
    "rationale": "why this works"
  }
]

Each variant should:
1. Use different approaches (quantified vs. qualitative, technical vs. business-focused, etc.)
2. Optimize for ATS keywords
3. Appeal to recruiters in the target industry
4. Match the seniority level

Return ONLY the JSON array. No markdown.`;

  try {
    const response = await genAI.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4, // Higher temperature for creative variants
        systemInstruction: 'You are an expert resume strategist. Always respond with valid JSON matching the exact schema provided.'
      }
    });

    if (!response.text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(response.text);
    return parsed as ResumeVariant[];
  } catch (error) {
    console.error('Gemini specific variant generation failed:', error);
    throw new Error(`Gemini specific variant generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
