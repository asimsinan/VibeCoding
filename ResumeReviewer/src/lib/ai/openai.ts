import OpenAI from 'openai';
import { GeminiAnalysisSchema, GeminiAnalysis, strictValidate } from './schemas';
import { withRetry, GeminiErrorHandler, CircuitBreaker } from './error-handler';
import { GeminiPerformanceTracker } from '../performance/monitor';

const MODEL = 'gpt-4o';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Circuit breaker instance for OpenAI API calls
const circuitBreaker = new CircuitBreaker();

export interface AnalysisContext {
  targetRole?: string;
  industry?: string;
  seniority?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  jobDescription?: string;
  companySize?: 'startup' | 'mid-size' | 'enterprise';
  location?: string;
}

export async function generateFeedbackViaOpenAI(
  fileName: string, 
  filePreviewText?: string,
  context?: AnalysisContext
): Promise<GeminiAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Build context-aware prompt
  const contextInfo = context ? `
CONTEXT FOR ANALYSIS:
- Target Role: ${context.targetRole || 'Not specified'}
- Industry: ${context.industry || 'Not specified'}
- Seniority Level: ${context.seniority || 'Not specified'}
- Company Size: ${context.companySize || 'Not specified'}
- Location: ${context.location || 'Not specified'}
${context.jobDescription ? `- Job Description: ${context.jobDescription}` : ''}
` : '';

  const prompt = `You are an expert resume reviewer and ATS specialist with 15+ years of experience in recruitment, HR technology, and talent acquisition. You have deep knowledge of Applicant Tracking Systems, recruiter behavior, and industry best practices.

IMPORTANT: First, identify and extract the candidate's full name from the resume content. This is critical for the analysis.

${contextInfo}

Conduct a comprehensive resume analysis and return STRICT JSON matching this exact schema:

{
  "scores": {
    "overall": 0-100,
    "content": 0-100,
    "formatting": 0-100,
    "keywords": 0-100,
    "impact": 0-100,
    "readability": 0-100,
    "atsCompatibility": 0-100,
    "recruiterAppeal": 0-100
  },
  "sections": [
    {
      "name": "section name",
      "score": 0-100,
      "details": "detailed analysis of this section",
      "issues": [
        {
          "id": "unique-id",
          "severity": "low|medium|high|critical",
          "text": "specific issue description",
          "evidence": "EXACT QUOTE from resume showing the problematic text",
          "impact": "how this affects ATS parsing or recruiter perception"
        }
      ],
      "fixes": [
        {
          "id": "unique-id",
          "action": "specific action to take",
          "example": "EXACT IMPROVED VERSION showing how the text should look",
          "reasoning": "why this fix improves the resume"
        }
      ]
    }
  ],
  "ats": {
    "keywordMatches": ["matched keywords"],
    "missingKeywords": ["missing important keywords"],
    "syntaxFlags": ["ATS compatibility issues"],
    "compatibilityScore": 0-100,
    "parsingIssues": ["specific parsing problems"],
    "optimizationTips": ["ATS-specific improvements"]
  },
  "recruiterView": {
    "sixSecondScan": "what recruiter sees in first 6 seconds",
    "redFlags": ["potential red flags"],
    "highlights": ["key strengths visible immediately"],
    "firstImpression": "excellent|good|average|poor",
    "scanningPattern": "how recruiters will scan this resume",
    "attentionGrabbers": ["elements that catch recruiter attention"],
    "concerns": ["potential concerns recruiters might have"]
  },
  "summary": {
    "elevatorPitch": "one-line compelling summary of candidate",
    "priorityFixes": [
      {
        "id": "unique-id",
        "impact": "low|medium|high",
        "difficulty": "easy|medium|hard",
        "description": "what to fix",
        "example": "example fix",
        "timeToImplement": "estimated time to fix"
      }
    ],
    "versioningRecommendation": "functional|reverse-chronological|hybrid",
    "industryFit": "how well this resume fits the target industry",
    "seniorityLevel": "assessed seniority level based on content"
  },
  "suggestions": ["actionable improvement suggestion 1", "actionable improvement suggestion 2"],
  "strengths": ["key strength 1", "key strength 2"],
  "improvements": ["areas for improvement"],
  "metadata": {
    "analysisVersion": "3.0",
    "generatedAt": "${new Date().toISOString()}",
    "modelUsed": "${MODEL}",
    "candidateName": "extracted name from resume",
    "analysisDepth": "comprehensive",
    "industryContext": "considered"
  }
}

COMPREHENSIVE ANALYSIS GUIDELINES:

1. **ATS COMPATIBILITY ANALYSIS:**
   - Check for ATS-friendly formatting (no tables, graphics, or complex layouts)
   - Verify keyword density and placement
   - Identify parsing issues (headers, bullet points, contact info)
   - Assess file format compatibility
   - Check for ATS-unfriendly elements

2. **RECRUITER PERSPECTIVE ANALYSIS:**
   - Analyze 6-second scan pattern
   - Identify attention-grabbing elements
   - Assess visual hierarchy and readability
   - Check for red flags that cause immediate rejection
   - Evaluate storytelling and impact

3. **CONTENT QUALITY ASSESSMENT:**
   - Quantify achievements with metrics
   - Check for action verbs and power words
   - Assess relevance to target role
   - Verify consistency and accuracy
   - Check for gaps or inconsistencies

4. **INDUSTRY-SPECIFIC ANALYSIS:**
   - Consider industry standards and expectations
   - Assess technical skills relevance
   - Check for industry-specific keywords
   - Evaluate experience depth and progression
   - Consider market trends and demands

5. **COMPETITIVE POSITIONING:**
   - Identify unique value propositions
   - Assess differentiation factors
   - Check for competitive advantages
   - Evaluate market positioning
   - Consider salary expectations alignment

CRITICAL REQUIREMENTS:
- Extract candidate's full name from resume content
- Provide EXACT text quotes for all issues with evidence
- Give SPECIFIC examples for all fixes showing improved versions
- Analyze ATS compatibility and recruiter appeal
- Consider both technical and human reader perspectives
- Prioritize fixes by impact and implementation difficulty
- Provide actionable, specific recommendations

Resume file: ${fileName}
${filePreviewText ? `\nResume content:\n${filePreviewText}` : '\nNote: No resume content provided - analyze based on filename and provide general guidance.'}

Return ONLY the JSON object. No markdown, no explanations, no additional text.`;

  return await circuitBreaker.execute(async () => {
    return await withRetry(async () => {
      const startTime = performance.now();
      
      console.log('Starting OpenAI API call...');
      console.log('Model:', MODEL);
      console.log('Prompt length:', prompt.length);
      
      try {
        // Use OpenAI with structured output and timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('OpenAI API request timed out after 2 minutes')), 120000);
        });
        
            const openaiPromise = openai.chat.completions.create({
              model: MODEL,
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert resume reviewer. Always respond with valid JSON matching the exact schema provided.'
                },
                {
                  role: 'user',
                  content: prompt + '\n\nPlease respond with valid JSON only.'
                }
              ],
              temperature: 0.1,
              max_completion_tokens: 4000,
              response_format: { type: "json_object" }
            });
        
        const response = await Promise.race([openaiPromise, timeoutPromise]) as any;
        
        console.log('OpenAI response received:', {
          hasResponse: !!response,
          hasChoices: !!response?.choices,
          choicesLength: response?.choices?.length || 0,
          hasContent: !!response?.choices?.[0]?.message?.content,
          responseKeys: Object.keys(response || {})
        });

        const endTime = performance.now();
        const latency = endTime - startTime;

        // Extract text from the correct response structure
        const responseText = response?.choices?.[0]?.message?.content;
        
        if (!responseText) {
          console.error('No text in response:', response);
          GeminiPerformanceTracker.trackRequest(MODEL, 0, 0, latency, false, 'Empty response');
          throw GeminiErrorHandler.handleError(new Error('Empty response from OpenAI'));
        }

        // Estimate token usage (rough approximation)
        const promptTokens = Math.ceil(prompt.length / 4);
        const responseTokens = Math.ceil(responseText.length / 4);

        // Parse and validate the JSON response with strict validation
        console.log('Attempting to parse JSON response...');
        const parsed = JSON.parse(responseText);
        console.log('JSON parsed successfully, validating with schema...');
        const validated = strictValidate(GeminiAnalysisSchema, parsed);
        console.log('Schema validation successful!');
        
        // Track successful request
        GeminiPerformanceTracker.trackRequest(MODEL, promptTokens, responseTokens, latency, true);
        
        return validated;
      } catch (error) {
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        console.error('OpenAI API Error:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined
        });
        
        // Handle timeout errors specifically
        if (error instanceof Error && error.message.includes('timed out')) {
          GeminiPerformanceTracker.trackRequest(MODEL, 0, 0, latency, false, 'Request timeout');
          throw new Error('Analysis is taking longer than expected. Please try again with a shorter resume or check your internet connection.');
        }
        
        GeminiPerformanceTracker.trackRequest(MODEL, 0, 0, latency, false, error instanceof Error ? error.message : 'Unknown error');
        throw GeminiErrorHandler.handleError(error);
      }
    });
  });
}

// Streaming version for real-time updates
export async function* generateFeedbackViaOpenAIStream(
  fileName: string, 
  filePreviewText?: string,
  context?: AnalysisContext
): AsyncGenerator<{ type: 'status' | 'data' | 'error', content: any }, void, unknown> {
  try {
    yield { type: 'status', content: { message: 'Initializing analysis...', progress: 10 } };
    
    const result = await generateFeedbackViaOpenAI(fileName, filePreviewText, context);
    
    yield { type: 'data', content: result };
    
  } catch (error) {
    yield { type: 'error', content: { message: error instanceof Error ? error.message : 'Analysis failed' } };
  }
}
