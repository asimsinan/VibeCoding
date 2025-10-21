(()=>{var exports={};exports.id=831,exports.ids=[831],exports.modules={53524:e=>{"use strict";e.exports=require("@prisma/client")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{"use strict";e.exports=require("assert")},78893:e=>{"use strict";e.exports=require("buffer")},61282:e=>{"use strict";e.exports=require("child_process")},84770:e=>{"use strict";e.exports=require("crypto")},17702:e=>{"use strict";e.exports=require("events")},92048:e=>{"use strict";e.exports=require("fs")},20629:e=>{"use strict";e.exports=require("fs/promises")},32615:e=>{"use strict";e.exports=require("http")},35240:e=>{"use strict";e.exports=require("https")},98216:e=>{"use strict";e.exports=require("net")},19801:e=>{"use strict";e.exports=require("os")},55315:e=>{"use strict";e.exports=require("path")},68621:e=>{"use strict";e.exports=require("punycode")},86624:e=>{"use strict";e.exports=require("querystring")},76162:e=>{"use strict";e.exports=require("stream")},82452:e=>{"use strict";e.exports=require("tls")},74175:e=>{"use strict";e.exports=require("tty")},17360:e=>{"use strict";e.exports=require("url")},21764:e=>{"use strict";e.exports=require("util")},71568:e=>{"use strict";e.exports=require("zlib")},15673:e=>{"use strict";e.exports=require("node:events")},97742:e=>{"use strict";e.exports=require("node:process")},84492:e=>{"use strict";e.exports=require("node:stream")},47261:e=>{"use strict";e.exports=require("node:util")},58359:()=>{},93739:()=>{},6665:(e,t,i)=>{"use strict";i.r(t),i.d(t,{originalPathname:()=>d,patchFetch:()=>p,requestAsyncStorage:()=>l,routeModule:()=>c,serverHooks:()=>m,staticGenerationAsyncStorage:()=>u});var s=i(49303),r=i(88716),n=i(60670),a=i(21157);let o="",c=new s.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/v1/upload/route",pathname:"/api/v1/upload",filename:"route",bundlePath:"app/api/v1/upload/route"},resolvedPagePath:"/Users/asimsinanyuksel/Desktop/ResumeReviewer/app/api/v1/upload/route.ts",nextConfigOutput:o,userland:a}),{requestAsyncStorage:l,staticGenerationAsyncStorage:u,serverHooks:m}=c,d="/api/v1/upload/route";function p(){return(0,n.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:u})}},21157:(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{"use strict";__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,{POST:()=>POST});var next_server__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__(87070),_src_lib_resume_reviewer_models__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__(97908),_src_lib_ai_gemini__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__(86635),_src_lib_security__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__(764),zod__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__(21067);let modelFactory=new _src_lib_resume_reviewer_models__WEBPACK_IMPORTED_MODULE_1__.uk,UploadRequestSchema=zod__WEBPACK_IMPORTED_MODULE_4__.Ry({file:zod__WEBPACK_IMPORTED_MODULE_4__.Yj()});function createErrorResponse(e,t,i=400,s){return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({error:!0,code:e,message:t,details:s,timestamp:new Date().toISOString()},{status:i})}function createSuccessResponse(e,t=200){return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(e,{status:t})}async function POST(request){try{let formData=await request.formData(),file=formData.get("file");if(!file)return(0,_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.oy)("MISSING_FILE",request),(0,_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.NB)(createErrorResponse("MISSING_FILE","File is required"));if(!_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.EK.validateFileName(file.name))return(0,_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.oy)("INVALID_FILENAME",request,{fileName:file.name}),(0,_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.NB)(createErrorResponse("INVALID_FILENAME","Invalid file name"));if(!_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.EK.validateFileType(file.type)&&"text/plain"!==file.type)return(0,_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.oy)("INVALID_FILE_TYPE",request,{fileType:file.type}),(0,_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.NB)(createErrorResponse("INVALID_FILE_TYPE","Unsupported file type. Please upload PDF, DOC, or DOCX."));if(!_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.EK.validateFileSize(file.size))return(0,_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.oy)("FILE_TOO_LARGE",request,{fileSize:file.size}),(0,_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.NB)(createErrorResponse("FILE_TOO_LARGE","File size cannot exceed 10MB"));let uploadModel=modelFactory.getResumeUploadModel(),upload=await uploadModel.create({fileName:file.name,fileSize:file.size,fileType:file.type}),feedbackModel=modelFactory.getFeedbackModel(),ai=null;try{let fileContent;if("application/pdf"===file.type){let buffer=await file.arrayBuffer();try{let PDFParser=eval("require")("pdf2json"),pdfParser=new PDFParser,pdfData=await new Promise((e,t)=>{pdfParser.on("pdfParser_dataError",t),pdfParser.on("pdfParser_dataReady",e),pdfParser.parseBuffer(Buffer.from(buffer))});if(fileContent=pdfData.Pages.map(e=>e.Texts.map(e=>e.R.map(e=>{try{return decodeURIComponent(e.T)}catch(t){return e.T||""}}).join("")).join(" ")).join("\n\n"),!fileContent.trim())throw Error("No text content found in PDF")}catch(pdfError){throw console.error("PDF parsing failed:",pdfError),Error("Failed to parse PDF file. Please ensure the file contains readable text.")}}else fileContent=await file.text();console.log("Starting AI analysis...");let startTime=Date.now();ai=await (0,_src_lib_ai_gemini__WEBPACK_IMPORTED_MODULE_2__.n)(file.name,fileContent);let endTime=Date.now();console.log(`AI analysis completed in ${endTime-startTime}ms`),await feedbackModel.create({uploadId:upload.id,overallScore:ai.scores.overall,contentScore:ai.scores.content,formattingScore:ai.scores.formatting,keywordScore:ai.scores.keywords,suggestions:ai.suggestions,strengths:ai.strengths,improvements:ai.improvements,analysis:JSON.stringify(ai.sections)}),await uploadModel.update(upload.id,{status:"COMPLETED"})}catch(e){console.error("Feedback generation or database operation failed:",e),ai=null;try{await uploadModel.update(upload.id,{status:"ERROR"}),console.log("Upload status updated to ERROR")}catch(updateError){console.error("Failed to update upload status to ERROR:",updateError)}}if(!ai)return createErrorResponse("OPENAI_FAILED","AI analysis failed. Please try again or check your internet connection.",502);let response=createSuccessResponse({uploadId:upload.id,status:"completed",aiProvider:"gemini",timestamp:upload.createdAt.toISOString(),fileInfo:{fileName:upload.fileName,fileSize:upload.fileSize,fileType:upload.fileType},feedback:{overallScore:ai.scores.overall,contentScore:ai.scores.content,formattingScore:ai.scores.formatting,keywordScore:ai.scores.keywords,suggestions:ai.suggestions,strengths:ai.strengths,improvements:ai.improvements,analysis:{sections:ai.sections},metadata:ai.metadata}}),finalResponse=(0,_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.NB)(response);return finalResponse}catch(error){if(console.error("Upload Error:",error),(0,_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.oy)("UPLOAD_ERROR",request,{error:error instanceof Error?error.message:"Unknown error"}),error instanceof Error){if(error.message.includes("Yavaş. \xc7ok abandınız!")||error.message.includes("rate limit")||error.message.includes("quota"))return(0,_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.NB)(createErrorResponse("RATE_LIMIT_EXCEEDED","Yavaş. \xc7ok abandınız!",429));if(error.message.includes("timeout")||error.message.includes("timed out"))return(0,_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.NB)(createErrorResponse("REQUEST_TIMEOUT","Analysis is taking longer than expected. Please try again.",408))}return(0,_src_lib_security__WEBPACK_IMPORTED_MODULE_3__.NB)(createErrorResponse("INTERNAL_SERVER_ERROR","Internal server error",500,void 0))}}},86635:(e,t,i)=>{"use strict";i.d(t,{n:()=>f});var s=i(45405);let r={maxRetries:3,baseDelay:1e3,maxDelay:1e4,backoffMultiplier:2,retryableErrors:["timeout","network","rate_limit","server_error","service_unavailable"]};class n extends Error{constructor(e,t=!0,i){super(e),this.retryable=t,this.statusCode=i,this.name="RetryableError"}}async function a(e,t={}){let i;let s={...r,...t};for(let t=0;t<=s.maxRetries;t++)try{return await e()}catch(r){if(i=r,t===s.maxRetries||!o(r,s))throw r;let e=Math.min(s.baseDelay*Math.pow(s.backoffMultiplier,t),s.maxDelay);console.warn(`Attempt ${t+1} failed, retrying in ${e}ms:`,r),await c(e)}throw i}function o(e,t){if(e instanceof n)return e.retryable;let i=e?.message?.toLowerCase()||"",s=e?.code?.toLowerCase()||"";return t.retryableErrors.some(e=>i.includes(e)||s.includes(e))}function c(e){return new Promise(t=>setTimeout(t,e))}class l{static handleError(e){return e instanceof n?e:"AbortError"===e.name||e.message?.includes("timeout")?new n("Request timeout",!0,408):e.message?.includes("rate limit")||e.message?.includes("quota")?new n("Yavaş. \xc7ok abandınız!",!0,429):e.message?.includes("500")||e.message?.includes("502")||e.message?.includes("503")||e.message?.includes("504")?new n("Server error",!0,500):e.message?.includes("401")||e.message?.includes("unauthorized")?new n("Authentication failed",!1,401):e.message?.includes("400")||e.message?.includes("bad request")?new n("Invalid request",!1,400):e.message?.includes("schema")||e.message?.includes("validation")?new n("Response validation failed",!1,422):new n(e.message||"Unknown error",!0)}}class u{constructor(e=5,t=6e4,i=3e5){this.failureThreshold=e,this.recoveryTimeout=t,this.monitoringPeriod=i,this.failures=0,this.lastFailureTime=0,this.state="CLOSED"}async execute(e){if("OPEN"===this.state){if(Date.now()-this.lastFailureTime>this.recoveryTimeout)this.state="HALF_OPEN";else throw new n("Circuit breaker is OPEN",!1,503)}try{let t=await e();return this.onSuccess(),t}catch(e){throw this.onFailure(),e}}onSuccess(){this.failures=0,this.state="CLOSED"}onFailure(){this.failures++,this.lastFailureTime=Date.now(),this.failures>=this.failureThreshold&&(this.state="OPEN")}getState(){return{state:this.state,failures:this.failures,lastFailureTime:this.lastFailureTime}}}var m=i(90234),d=i(58954);let p="gemini-2.5-pro",h=new d.fA({apiKey:process.env.GEMINI_API_KEY}),g=new u;async function f(e,t,i){if(!process.env.GEMINI_API_KEY)throw Error("GEMINI_API_KEY not configured");let r=i?`
CONTEXT FOR ANALYSIS:
- Target Role: ${i.targetRole||"Not specified"}
- Industry: ${i.industry||"Not specified"}
- Seniority Level: ${i.seniority||"Not specified"}
- Company Size: ${i.companySize||"Not specified"}
- Location: ${i.location||"Not specified"}
${i.jobDescription?`- Job Description: ${i.jobDescription}`:""}
`:"",n=`You are an expert resume reviewer and ATS specialist with 15+ years of experience in recruitment, HR technology, and talent acquisition. You have deep knowledge of Applicant Tracking Systems, recruiter behavior, and industry best practices.

IMPORTANT: First, identify and extract the candidate's full name from the resume content. This is critical for the analysis.

LANGUAGE INSTRUCTION: Analyze the language of the resume content and respond in the SAME LANGUAGE as the resume. If the resume is in Turkish, respond in Turkish. If in English, respond in English. If in another language, respond in that language. This ensures the analysis is natural and user-friendly.

${r}

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
    "modelUsed": "${p}",
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

Resume file: ${e}
${t?`
Resume content:
${t}`:"\nNote: No resume content provided - analyze based on filename and provide general guidance."}

Return ONLY the JSON object. No markdown, no explanations, no additional text.`;return await g.execute(async()=>await a(async()=>{let e=performance.now();try{let t=new Promise((e,t)=>{setTimeout(()=>t(Error("Gemini API request timed out after 60 seconds")),12e4)}),i=h.models.generateContent({model:p,contents:n,config:{responseMimeType:"application/json",temperature:.1,systemInstruction:"You are an expert resume reviewer. Always respond with valid JSON matching the exact schema provided. Respond in the same language as the resume content for natural user experience."}}),r=await Promise.race([i,t]),a=performance.now()-e,o=r?.candidates?.[0]?.content?.parts?.[0]?.text;if(!o)throw console.error("No text in response:",r),m.Ve.trackRequest(p,0,0,a,!1,"Empty response"),l.handleError(Error("Empty response from Gemini"));let c=Math.ceil(n.length/4),u=Math.ceil(o.length/4),d=JSON.parse(o),g=(0,s.Dz)(s.jz,d);return m.Ve.trackRequest(p,c,u,a,!0),g}catch(i){let t=performance.now()-e;if(console.error("Gemini API Error:",i),console.error("Error details:",{message:i instanceof Error?i.message:"Unknown error",stack:i instanceof Error?i.stack:void 0,name:i instanceof Error?i.name:void 0}),i instanceof Error&&i.message.includes("timed out"))throw m.Ve.trackRequest(p,0,0,t,!1,"Request timeout"),Error("Analysis is taking longer than expected. Please try again with a shorter resume or check your internet connection.");throw m.Ve.trackRequest(p,0,0,t,!1,i instanceof Error?i.message:"Unknown error"),l.handleError(i)}}))}},45405:(e,t,i)=>{"use strict";i.d(t,{Dz:()=>r,hz:()=>f,jz:()=>p});var s=i(21067);function r(e,t){let i=e.safeParse(t);if(!i.success)throw console.error("Schema validation failed:",i.error.issues),Error(`Schema validation failed: ${i.error.issues.map(e=>e.message).join(", ")}`);return i.data}let n=s.Ry({overall:s.Rx().min(0).max(100),content:s.Rx().min(0).max(100),formatting:s.Rx().min(0).max(100),keywords:s.Rx().min(0).max(100),impact:s.Rx().min(0).max(100),readability:s.Rx().min(0).max(100),atsCompatibility:s.Rx().min(0).max(100),recruiterAppeal:s.Rx().min(0).max(100)}),a=s.Ry({id:s.Z_(),severity:s.Km(["low","medium","high","critical"]),text:s.Z_(),evidence:s.Z_(),impact:s.Z_()}),o=s.Ry({id:s.Z_(),action:s.Z_(),example:s.Z_(),reasoning:s.Z_()}),c=s.Ry({name:s.Z_(),score:s.Rx().min(0).max(100),details:s.Z_(),issues:s.IX(a),fixes:s.IX(o)}),l=s.Ry({keywordMatches:s.IX(s.Z_()),missingKeywords:s.IX(s.Z_()),syntaxFlags:s.IX(s.Z_()),compatibilityScore:s.Rx().min(0).max(100),parsingIssues:s.IX(s.Z_()),optimizationTips:s.IX(s.Z_())}),u=s.Ry({sixSecondScan:s.Z_(),redFlags:s.IX(s.Z_()),highlights:s.IX(s.Z_()),firstImpression:s.Km(["excellent","good","average","poor"]),scanningPattern:s.Z_(),attentionGrabbers:s.IX(s.Z_()),concerns:s.IX(s.Z_())}),m=s.Ry({id:s.Z_(),impact:s.Km(["low","medium","high"]),difficulty:s.Km(["easy","medium","hard"]),description:s.Z_(),example:s.Z_(),timeToImplement:s.Z_()}),d=s.Ry({elevatorPitch:s.Z_(),priorityFixes:s.IX(m),versioningRecommendation:s.Km(["functional","reverse-chronological","hybrid"]),industryFit:s.Z_(),seniorityLevel:s.Z_()}),p=s.Ry({scores:n,sections:s.IX(c),ats:l,recruiterView:u,summary:d,suggestions:s.IX(s.Ry({id:s.Z_(),text:s.Z_(),evidence:s.Z_(),example:s.Z_(),impact:s.Km(["low","medium","high"])})),strengths:s.IX(s.Ry({id:s.Z_(),text:s.Z_(),evidence:s.Z_(),category:s.Km(["leadership","technical","communication","achievement"])})),improvements:s.IX(s.Ry({id:s.Z_(),text:s.Z_(),evidence:s.Z_(),example:s.Z_(),severity:s.Km(["low","medium","high","critical"])})),metadata:s.Ry({analysisVersion:s.Z_(),generatedAt:s.Z_(),modelUsed:s.Z_(),candidateName:s.Z_().optional(),analysisDepth:s.Z_(),industryContext:s.Z_()})}),h=s.Ry({id:s.Z_(),type:s.Km(["headline","summary","skills","experience"]),content:s.Z_(),rationale:s.Z_()}),g=s.Ry({ranking:s.IX(s.Ry({id:s.Z_(),score:s.Rx().min(0).max(100),reasons:s.IX(s.Z_())})),winner:s.Ry({id:s.Z_(),score:s.Rx()}),improvements:s.IX(s.Ry({variantId:s.Z_(),changes:s.IX(s.Z_())}))}),f=s.Ry({variants:s.IX(h),tournament:g})},90234:(e,t,i)=>{"use strict";i.d(t,{Ad:()=>s,Ve:()=>r});class s{static getInstance(){return s.instance||(s.instance=new s),s.instance}startOperation(e,t){let i=`${e}_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;return performance.now(),i}endOperation(e,t=!0,i){return performance.now(),console.warn(`Performance operation ${e} not found`),null}addAPIMetric(e){this.apiMetrics.push(e),this.apiMetrics.length>this.maxMetrics&&this.apiMetrics.shift()}addGeminiMetric(e){this.geminiMetrics.push(e),this.geminiMetrics.length>this.maxMetrics&&this.geminiMetrics.shift()}addMetric(e){this.metrics.push(e),this.metrics.length>this.maxMetrics&&this.metrics.shift()}getMetrics(e){return e?this.metrics.filter(t=>t.operation===e):[...this.metrics]}getAPIMetrics(){return[...this.apiMetrics]}getGeminiMetrics(){return[...this.geminiMetrics]}getAverageLatency(e){let t=e?this.metrics.filter(t=>t.operation===e):this.metrics;return 0===t.length?0:t.reduce((e,t)=>e+t.duration,0)/t.length}getSuccessRate(e){let t=e?this.metrics.filter(t=>t.operation===e):this.metrics;return 0===t.length?0:t.filter(e=>e.success).length/t.length*100}getPerformanceSummary(){let e=this.metrics.length,t=this.getAverageLatency(),i=this.getSuccessRate(),s=Object.entries(this.metrics.reduce((e,t)=>(e[t.operation]||(e[t.operation]=[]),e[t.operation].push(t),e),{})).map(([e,t])=>({operation:e,avgLatency:t.reduce((e,t)=>e+t.duration,0)/t.length})).sort((e,t)=>t.avgLatency-e.avgLatency).slice(0,5),r=e>0?(e-this.metrics.filter(e=>e.success).length)/e*100:0;return{totalOperations:e,averageLatency:t,successRate:i,topSlowOperations:s,errorRate:r}}clearMetrics(){this.metrics=[],this.apiMetrics=[],this.geminiMetrics=[]}constructor(){this.metrics=[],this.apiMetrics=[],this.geminiMetrics=[],this.maxMetrics=1e3}}class r{static trackRequest(e,t,i,r,n,a){let o=s.getInstance(),c={model:e,promptTokens:t,responseTokens:i,totalTokens:t+i,latency:r,success:n,error:a,timestamp:Date.now()};o.addGeminiMetric(c)}}},764:(e,t,i)=>{"use strict";i.d(t,{EK:()=>n,NB:()=>a,oy:()=>o}),i(87070);class s{constructor(e){this.store={},this.config=e}isAllowed(e){let t=this.config.keyGenerator?this.config.keyGenerator(e):this.getDefaultKey(e),i=Date.now();return(this.config.windowMs,Object.keys(this.store).forEach(e=>{this.store[e].resetTime<i&&delete this.store[e]}),this.store[t])?this.store[t].count<this.config.maxRequests&&(this.store[t].count++,!0):(this.store[t]={count:1,resetTime:i+this.config.windowMs},!0)}getDefaultKey(e){let t=e.headers.get("x-forwarded-for"),i=t?t.split(",")[0]:e.ip||"unknown";return`rate_limit:${i}`}getRemainingTime(e){let t=this.config.keyGenerator?this.config.keyGenerator(e):this.getDefaultKey(e),i=this.store[t];return i?Math.max(0,i.resetTime-Date.now()):0}}new s({windowMs:9e5,maxRequests:100}),new s({windowMs:36e5,maxRequests:5});class r{static getInstance(){return r.instance||(r.instance=new r),r.instance}addKey(e,t){this.keys.set(e,{key:t,createdAt:Date.now(),lastUsed:0})}getKey(e){let t=this.keys.get(e);return t?(t.lastUsed=Date.now(),t.key):null}rotateKey(e,t){this.keys.set(e,{key:t,createdAt:Date.now(),lastUsed:Date.now()})}removeKey(e){return this.keys.delete(e)}getKeyInfo(e){let t=this.keys.get(e);return t?{createdAt:t.createdAt,lastUsed:t.lastUsed}:null}getAllKeys(){return Array.from(this.keys.entries()).map(([e,t])=>({id:e,createdAt:t.createdAt,lastUsed:t.lastUsed}))}constructor(){this.keys=new Map}}class n{static validateFileName(e){let t=/\.\./;return!/[<>:"/\\|?*\x00-\x1f]/.test(e)&&!t.test(e)&&e.length>0&&e.length<=255}static sanitizeText(e){return e.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,"").replace(/<[^>]*>/g,"").trim()}static validateFileSize(e,t=10485760){return e>0&&e<=t}static validateFileType(e){return["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(e)}}function a(e){return e.headers.set("X-Content-Type-Options","nosniff"),e.headers.set("X-Frame-Options","DENY"),e.headers.set("X-XSS-Protection","1; mode=block"),e.headers.set("Referrer-Policy","strict-origin-when-cross-origin"),e.headers.set("Permissions-Policy","camera=(), microphone=(), geolocation=()"),e.headers.set("Content-Security-Policy","default-src 'none'; script-src 'none'; style-src 'none'; img-src 'none'"),e}function o(e,t,i){let s={timestamp:new Date().toISOString(),event:e,ip:t.headers.get("x-forwarded-for")||t.ip||"unknown",userAgent:t.headers.get("user-agent")||"unknown",method:t.method,url:t.url,...i};console.log(`[SECURITY] ${e}:`,JSON.stringify(s))}}};var __webpack_require__=require("../../../../webpack-runtime.js");__webpack_require__.C(exports);var __webpack_exec__=e=>__webpack_require__(__webpack_require__.s=e),__webpack_exports__=__webpack_require__.X(0,[276,972,67,954,506],()=>__webpack_exec__(6665));module.exports=__webpack_exports__})();