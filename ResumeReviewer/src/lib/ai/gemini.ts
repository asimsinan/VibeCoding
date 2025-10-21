import { GeminiAnalysisSchema, GeminiAnalysis, GeminiJsonSchema, strictValidate } from './schemas';
import { withRetry, GeminiErrorHandler, CircuitBreaker } from './error-handler';
import { GeminiPerformanceTracker } from '../performance/monitor';
import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-2.5-pro';

// Initialize the new Gemini client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Circuit breaker instance for Gemini API calls
const circuitBreaker = new CircuitBreaker();

export interface AnalysisContext {
  targetRole?: string;
  industry?: string;
  seniority?: 'entry' | 'mid' | 'senior' | 'executive';
  jobDescription?: string;
  companySize?: 'startup' | 'mid-size' | 'enterprise';
  location?: string;
}

export async function generateFeedbackViaGemini(
  fileName: string, 
  filePreviewText?: string,
  context?: AnalysisContext
): Promise<GeminiAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
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

LANGUAGE INSTRUCTION: Analyze the language of the resume content and respond in the SAME LANGUAGE as the resume. If the resume is in Turkish, respond in Turkish. If in English, respond in English. If in another language, respond in that language. This ensures the analysis is natural and user-friendly.

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
  "suggestions": [
    {
      "id": "suggestion-1",
      "text": "specific actionable suggestion",
      "evidence": "EXACT QUOTE from resume showing where this applies",
      "example": "SPECIFIC EXAMPLE of how to implement this suggestion",
      "impact": "low|medium|high"
    }
  ],
  "strengths": [
    {
      "id": "strength-1", 
      "text": "specific strength description",
      "evidence": "EXACT QUOTE from resume demonstrating this strength",
      "category": "leadership|technical|communication|achievement"
    }
  ],
  "improvements": [
    {
      "id": "improvement-1",
      "text": "specific area needing improvement",
      "evidence": "EXACT QUOTE from resume showing the problematic text",
      "example": "IMPROVED VERSION showing how it should look",
      "severity": "low|medium|high|critical"
    }
  ],
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
- For suggestions: Include EXACT QUOTES showing where each suggestion applies and SPECIFIC EXAMPLES of implementation
- For strengths: Include EXACT QUOTES demonstrating each strength with proper categorization
- For improvements: Include EXACT QUOTES of problematic text and IMPROVED VERSIONS showing corrections
- Analyze ATS compatibility and recruiter appeal
- Consider both technical and human reader perspectives
- Prioritize fixes by impact and implementation difficulty
- Provide actionable, specific recommendations with concrete examples

Resume file: ${fileName}
${filePreviewText ? `\nResume content:\n${filePreviewText}` : '\nNote: No resume content provided - analyze based on filename and provide general guidance.'}

Return ONLY the JSON object. No markdown, no explanations, no additional text.`;

  return await circuitBreaker.execute(async () => {
    return await withRetry(async () => {
      const startTime = performance.now();
      
      
      try {
        // Retry logic with exponential backoff for Gemini API overloads
        const maxRetries = 3;
        let lastError: any;
        let response: any;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            // Use the new SDK with structured output and optimized timeout
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Gemini API request timed out after 60 seconds')), 120000);
            });
            
            const geminiPromise = genAI.models.generateContent({
              model: MODEL,
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                temperature: 0.1,
                systemInstruction: 'You are an expert resume reviewer. Always respond with valid JSON matching the exact schema provided. Respond in the same language as the resume content for natural user experience.'
              }
            });
            
            response = await Promise.race([geminiPromise, timeoutPromise]) as any;
            
            // If successful, break out of retry loop
            break;
            
          } catch (error: any) {
            lastError = error;
            
            // Check if it's a retryable error (503, overloaded, etc.)
            const isRetryable = error.message?.includes('overloaded') || 
                              error.message?.includes('503') || 
                              error.message?.includes('UNAVAILABLE') ||
                              error.message?.includes('timeout');
            
            if (!isRetryable || attempt === maxRetries) {
              throw error; // Don't retry non-retryable errors or if max retries reached
            }
            
            // Exponential backoff: wait 2^attempt seconds
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Gemini API attempt ${attempt} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        // Extract text from the correct response structure
        const responseText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!responseText) {
          console.error('No text in response:', response);
          const endTime = performance.now();
          const latency = endTime - startTime;
          GeminiPerformanceTracker.trackRequest(MODEL, 0, 0, latency, false, 'Empty response');
          throw GeminiErrorHandler.handleError(new Error('Empty response from Gemini'));
        }

        // Estimate token usage (rough approximation)
        const promptTokens = Math.ceil(prompt.length / 4);
        const responseTokens = Math.ceil(responseText.length / 4);

        // Parse and validate the JSON response with strict validation
        const parsed = JSON.parse(responseText);
        const validated = strictValidate(GeminiAnalysisSchema, parsed);
        
        // Track successful request
        const endTime = performance.now();
        const latency = endTime - startTime;
        GeminiPerformanceTracker.trackRequest(MODEL, promptTokens, responseTokens, latency, true);
        
        return validated;
        
      } catch (error) {
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        console.error('Gemini API Error:', error);
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

// Streaming version using the new SDK
export async function* generateFeedbackViaGeminiStream(
  fileName: string, 
  filePreviewText?: string,
  context?: AnalysisContext
): AsyncGenerator<{ type: 'status' | 'data' | 'error'; content: any }, void, unknown> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Build context-aware prompt (same as above)
  const contextInfo = context ? `
CONTEXT FOR ANALYSIS:
- Target Role: ${context.targetRole || 'Not specified'}
- Industry: ${context.industry || 'Not specified'}
- Seniority Level: ${context.seniority || 'Not specified'}
- Company Size: ${context.companySize || 'Not specified'}
- Location: ${context.location || 'Not specified'}
${context.jobDescription ? `- Job Description: ${context.jobDescription}` : ''}
` : '';

  const prompt = `You are an expert resume reviewer for ATS systems and hiring managers with 15+ years of experience. Your analysis will be used by job seekers to optimize their resumes for maximum impact.

IMPORTANT: First, identify and extract the candidate's full name from the resume content. This is critical for the analysis.

LANGUAGE INSTRUCTION: Analyze the language of the resume content and respond in the SAME LANGUAGE as the resume. If the resume is in Turkish, respond in Turkish. If in English, respond in English. If in another language, respond in that language. This ensures the analysis is natural and user-friendly.

${contextInfo}

Analyze the resume and return STRICT JSON matching this exact schema:

{
  "scores": {
    "overall": 0-100,
    "content": 0-100,
    "formatting": 0-100,
    "keywords": 0-100,
    "impact": 0-100,
    "readability": 0-100
  },
  "sections": [
    {
      "name": "section name",
      "score": 0-100,
      "issues": [
        {
          "id": "unique-id",
          "severity": "low|medium|high|critical",
          "text": "issue description",
          "evidence": "EXACT QUOTE from resume showing the problematic text"
        }
      ],
      "fixes": [
        {
          "id": "unique-id",
          "action": "specific action to take",
          "example": "EXACT IMPROVED VERSION showing how the text should look"
        }
      ]
    }
  ],
  "ats": {
    "keywordMatches": ["matched keywords"],
    "missingKeywords": ["missing important keywords"],
    "syntaxFlags": ["ATS compatibility issues"],
    "compatibilityScore": 0-100
  },
  "recruiterView": {
    "sixSecondScan": "what recruiter sees in 6 seconds",
    "redFlags": ["potential red flags"],
    "highlights": ["key strengths visible"],
    "firstImpression": "excellent|good|average|poor"
  },
  "summary": {
    "elevatorPitch": "one-line summary of candidate",
    "priorityFixes": [
      {
        "id": "unique-id",
        "impact": "low|medium|high",
        "difficulty": "easy|medium|hard",
        "description": "what to fix",
        "example": "example fix"
      }
    ],
    "versioningRecommendation": "functional|reverse-chronological|hybrid"
  },
  "suggestions": ["simple string suggestion 1", "simple string suggestion 2"],
  "strengths": ["simple string strength 1", "simple string strength 2"],
  "improvements": ["areas for improvement"],
  "metadata": {
    "analysisVersion": "2.0",
    "generatedAt": "${new Date().toISOString()}",
    "modelUsed": "${MODEL}",
    "candidateName": "extracted name from resume"
  }
}

ANALYSIS GUIDELINES:
1. Score based on ATS compatibility, recruiter appeal, and industry standards
2. Provide specific, actionable feedback with EXACT TEXT REFERENCES
3. Consider the target role and industry context
4. Flag critical issues that would cause immediate rejection
5. Highlight strengths that differentiate the candidate
6. Prioritize fixes by impact and difficulty
7. CRITICAL: Extract the candidate's full name from the resume content and include it in metadata.candidateName
   - Look for the name at the top of the resume, in headers, or contact information
   - Use the complete name as it appears (e.g., "John Smith" not just "John")
   - If no name is found, use "Unknown Candidate"

CRITICAL JSON FORMAT REQUIREMENTS:
- suggestions MUST be an array of simple strings, NOT objects
- strengths MUST be an array of simple strings, NOT objects
- Each suggestion should be a single string like "Add quantifiable metrics to achievements"
- Each strength should be a single string like "Strong technical skills demonstrated"
- DO NOT use objects with id, text, example fields for suggestions or strengths
- For each issue, provide the EXACT text excerpt from the resume that needs improvement
- Quote the problematic text verbatim in the "evidence" field
- For each fix, provide a SPECIFIC example showing the improved version
- Use quotation marks to clearly distinguish resume text from your suggestions
- Be precise about which sentences, phrases, or sections need changes

Resume file: ${fileName}
${filePreviewText ? `\nResume content:\n${filePreviewText}` : '\nNote: No resume content provided - analyze based on filename and provide general guidance.'}

Return ONLY the JSON object. No markdown, no explanations, no additional text.
REMEMBER: suggestions and strengths must be arrays of strings, not objects!`;

  try {
    yield { type: 'status', content: { message: 'Starting analysis...', progress: 10 } };
    
    // Use streaming with the new SDK
    const stream = await genAI.models.generateContentStream({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        systemInstruction: 'You are an expert resume reviewer. Always respond with valid JSON matching the exact schema provided. Respond in the same language as the resume content for natural user experience.'
      }
    });

    let fullResponse = '';
    
    for await (const chunk of stream) {
      if (chunk.text) {
        fullResponse += chunk.text;
        yield { type: 'status', content: { message: 'Analyzing resume...', progress: 50 } };
      }
    }

    yield { type: 'status', content: { message: 'Processing results...', progress: 75 } };

    // Parse and validate the complete response with strict validation
    const parsed = JSON.parse(fullResponse);
    const validated = strictValidate(GeminiAnalysisSchema, parsed);
    
    yield { type: 'data', content: validated };
    
  } catch (error) {
    yield { type: 'error', content: { message: error instanceof Error ? error.message : 'Analysis failed' } };
  }
}