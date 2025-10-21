import { z } from 'zod';

// Generate JSON Schema from Zod schema for strict validation
export function generateJsonSchema(schema: z.ZodSchema) {
  return JSON.stringify(schema._def, null, 2);
}

// Strict validation helper that enforces exact object structure
export function strictValidate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    console.error('Schema validation failed:', result.error.issues);
    throw new Error(`Schema validation failed: ${result.error.issues.map(i => i.message).join(', ')}`);
  }
  
  return result.data;
}

// Core analysis schemas - Enhanced for comprehensive analysis
export const ScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  content: z.number().min(0).max(100),
  formatting: z.number().min(0).max(100),
  keywords: z.number().min(0).max(100),
  impact: z.number().min(0).max(100),
  readability: z.number().min(0).max(100),
  atsCompatibility: z.number().min(0).max(100),
  recruiterAppeal: z.number().min(0).max(100),
});

export const SectionIssueSchema = z.object({
  id: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  text: z.string(),
  evidence: z.string(),
  impact: z.string(),
});

export const SectionFixSchema = z.object({
  id: z.string(),
  action: z.string(),
  example: z.string(),
  reasoning: z.string(),
});

export const SectionAnalysisSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(100),
  details: z.string(),
  issues: z.array(SectionIssueSchema),
  fixes: z.array(SectionFixSchema),
});

export const ATSAnalysisSchema = z.object({
  keywordMatches: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  syntaxFlags: z.array(z.string()),
  compatibilityScore: z.number().min(0).max(100),
  parsingIssues: z.array(z.string()),
  optimizationTips: z.array(z.string()),
});

export const RecruiterViewSchema = z.object({
  sixSecondScan: z.string(),
  redFlags: z.array(z.string()),
  highlights: z.array(z.string()),
  firstImpression: z.enum(['excellent', 'good', 'average', 'poor']),
  scanningPattern: z.string(),
  attentionGrabbers: z.array(z.string()),
  concerns: z.array(z.string()),
});

export const PriorityFixSchema = z.object({
  id: z.string(),
  impact: z.enum(['low', 'medium', 'high']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  description: z.string(),
  example: z.string(),
  timeToImplement: z.string(),
});

export const AnalysisSummarySchema = z.object({
  elevatorPitch: z.string(),
  priorityFixes: z.array(PriorityFixSchema),
  versioningRecommendation: z.enum(['functional', 'reverse-chronological', 'hybrid']),
  industryFit: z.string(),
  seniorityLevel: z.string(),
});

// Main Gemini response schema
export const GeminiAnalysisSchema = z.object({
  scores: ScoreSchema,
  sections: z.array(SectionAnalysisSchema),
  ats: ATSAnalysisSchema,
  recruiterView: RecruiterViewSchema,
  summary: AnalysisSummarySchema,
  suggestions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    evidence: z.string(),
    example: z.string(),
    impact: z.enum(['low', 'medium', 'high'])
  })),
  strengths: z.array(z.object({
    id: z.string(),
    text: z.string(),
    evidence: z.string(),
    category: z.enum(['leadership', 'technical', 'communication', 'achievement'])
  })),
  improvements: z.array(z.object({
    id: z.string(),
    text: z.string(),
    evidence: z.string(),
    example: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical'])
  })),
  metadata: z.object({
    analysisVersion: z.string(),
    generatedAt: z.string(),
    modelUsed: z.string(),
    candidateName: z.string().optional(),
    analysisDepth: z.string(),
    industryContext: z.string(),
  }),
});

// Generate JSON Schema for Gemini API to enforce exact structure
export const GeminiJsonSchema = {
  type: "object",
  properties: {
    scores: {
      type: "object",
      properties: {
        overall: { type: "number", minimum: 0, maximum: 100 },
        content: { type: "number", minimum: 0, maximum: 100 },
        formatting: { type: "number", minimum: 0, maximum: 100 },
        keywords: { type: "number", minimum: 0, maximum: 100 }
      },
      required: ["overall", "content", "formatting", "keywords"]
    },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          score: { type: "number", minimum: 0, maximum: 100 },
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                text: { type: "string" },
                evidence: { type: "string" }
              },
              required: ["id", "severity", "text", "evidence"]
            }
          },
          fixes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                action: { type: "string" },
                example: { type: "string" }
              },
              required: ["id", "action", "example"]
            }
          }
        },
        required: ["name", "score", "issues", "fixes"]
      }
    },
    suggestions: {
      type: "array",
      items: { type: "string" }
    },
    strengths: {
      type: "array", 
      items: { type: "string" }
    },
    improvements: {
      type: "array",
      items: { type: "string" }
    },
    metadata: {
      type: "object",
      properties: {
        analysisVersion: { type: "string" },
        generatedAt: { type: "string" },
        modelUsed: { type: "string" },
        candidateName: { type: "string" }
      },
      required: ["analysisVersion", "generatedAt", "modelUsed"]
    }
  },
  required: ["scores", "sections", "suggestions", "strengths", "improvements", "metadata"]
};

// Variant generation schemas
export const ResumeVariantSchema = z.object({
  id: z.string(),
  type: z.enum(['headline', 'summary', 'skills', 'experience']),
  content: z.string(),
  rationale: z.string(),
});

export const TournamentRankingSchema = z.object({
  ranking: z.array(z.object({
    id: z.string(),
    score: z.number().min(0).max(100),
    reasons: z.array(z.string()),
  })),
  winner: z.object({
    id: z.string(),
    score: z.number(),
  }),
  improvements: z.array(z.object({
    variantId: z.string(),
    changes: z.array(z.string()),
  })),
});

export const VariantResponseSchema = z.object({
  variants: z.array(ResumeVariantSchema),
  tournament: TournamentRankingSchema,
});

// Type exports
export type Score = z.infer<typeof ScoreSchema>;
export type SectionIssue = z.infer<typeof SectionIssueSchema>;
export type SectionFix = z.infer<typeof SectionFixSchema>;
export type SectionAnalysis = z.infer<typeof SectionAnalysisSchema>;
export type ATSAnalysis = z.infer<typeof ATSAnalysisSchema>;
export type RecruiterView = z.infer<typeof RecruiterViewSchema>;
export type PriorityFix = z.infer<typeof PriorityFixSchema>;
export type AnalysisSummary = z.infer<typeof AnalysisSummarySchema>;
export type GeminiAnalysis = z.infer<typeof GeminiAnalysisSchema>;
export type ResumeVariant = z.infer<typeof ResumeVariantSchema>;
export type TournamentRanking = z.infer<typeof TournamentRankingSchema>;
export type VariantResponse = z.infer<typeof VariantResponseSchema>;
