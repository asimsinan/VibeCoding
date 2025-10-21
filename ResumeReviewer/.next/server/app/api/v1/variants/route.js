(()=>{var e={};e.id=703,e.ids=[703],e.modules={20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{"use strict";e.exports=require("assert")},78893:e=>{"use strict";e.exports=require("buffer")},61282:e=>{"use strict";e.exports=require("child_process")},84770:e=>{"use strict";e.exports=require("crypto")},17702:e=>{"use strict";e.exports=require("events")},92048:e=>{"use strict";e.exports=require("fs")},20629:e=>{"use strict";e.exports=require("fs/promises")},32615:e=>{"use strict";e.exports=require("http")},35240:e=>{"use strict";e.exports=require("https")},98216:e=>{"use strict";e.exports=require("net")},19801:e=>{"use strict";e.exports=require("os")},55315:e=>{"use strict";e.exports=require("path")},68621:e=>{"use strict";e.exports=require("punycode")},86624:e=>{"use strict";e.exports=require("querystring")},76162:e=>{"use strict";e.exports=require("stream")},82452:e=>{"use strict";e.exports=require("tls")},74175:e=>{"use strict";e.exports=require("tty")},17360:e=>{"use strict";e.exports=require("url")},21764:e=>{"use strict";e.exports=require("util")},71568:e=>{"use strict";e.exports=require("zlib")},15673:e=>{"use strict";e.exports=require("node:events")},97742:e=>{"use strict";e.exports=require("node:process")},84492:e=>{"use strict";e.exports=require("node:stream")},47261:e=>{"use strict";e.exports=require("node:util")},58359:()=>{},93739:()=>{},1928:(e,t,r)=>{"use strict";r.r(t),r.d(t,{originalPathname:()=>_,patchFetch:()=>g,requestAsyncStorage:()=>x,routeModule:()=>h,serverHooks:()=>f,staticGenerationAsyncStorage:()=>v});var i={};r.r(i),r.d(i,{POST:()=>y});var s=r(49303),n=r(88716),a=r(60670),o=r(87070),c=r(45405),u=r(58954);let p=process.env.GEMINI_MODEL||"gemini-2.5-flash",m=new u.fA({});async function d(e,t){if(!(process.env.GEMINI_API_KEY||process.env.NEXT_PUBLIC_GEMINI_API_KEY))throw Error("GEMINI_API_KEY not configured");let r=`You are an expert resume strategist. Generate multiple variants of key resume sections and then rank them using a tournament-style system.

CONTEXT:
- Target Role: ${t.targetRole||"Not specified"}
- Industry: ${t.industry||"Not specified"}
- Seniority: ${t.seniority||"Not specified"}
${t.jobDescription?`- Job Description: ${t.jobDescription}`:""}
${t.focusAreas?`- Focus Areas: ${t.focusAreas.join(", ")}`:""}

RESUME CONTENT:
${e}

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

Return ONLY the JSON object. No markdown, no explanations.`;try{let e=await m.models.generateContent({model:p,contents:r,config:{responseMimeType:"application/json",temperature:.3,systemInstruction:"You are an expert resume strategist. Always respond with valid JSON matching the exact schema provided."}});if(!e.text)throw Error("Empty response from Gemini");let t=JSON.parse(e.text);return c.hz.parse(t)}catch(e){throw console.error("Gemini variant generation failed:",e),Error(`Gemini variant generation failed: ${e instanceof Error?e.message:"Unknown error"}`)}}async function l(e,t,r){if(!(process.env.GEMINI_API_KEY||process.env.NEXT_PUBLIC_GEMINI_API_KEY))throw Error("GEMINI_API_KEY not configured");let i=`Generate 5 different variants for the ${e} section of a resume.

CONTEXT:
- Target Role: ${r.targetRole||"Not specified"}
- Industry: ${r.industry||"Not specified"}
- Seniority: ${r.seniority||"Not specified"}

ORIGINAL ${e.toUpperCase()}:
${t}

Return STRICT JSON array:
[
  {
    "id": "variant-1",
    "type": "${e}",
    "content": "variant content",
    "rationale": "why this works"
  },
  {
    "id": "variant-2",
    "type": "${e}",
    "content": "variant content",
    "rationale": "why this works"
  }
]

Each variant should:
1. Use different approaches (quantified vs. qualitative, technical vs. business-focused, etc.)
2. Optimize for ATS keywords
3. Appeal to recruiters in the target industry
4. Match the seniority level

Return ONLY the JSON array. No markdown.`;try{let e=await m.models.generateContent({model:p,contents:i,config:{responseMimeType:"application/json",temperature:.4,systemInstruction:"You are an expert resume strategist. Always respond with valid JSON matching the exact schema provided."}});if(!e.text)throw Error("Empty response from Gemini");return JSON.parse(e.text)}catch(e){throw console.error("Gemini specific variant generation failed:",e),Error(`Gemini specific variant generation failed: ${e instanceof Error?e.message:"Unknown error"}`)}}async function y(e){try{let{resumeContent:t,context:r,sectionType:i}=await e.json();if(!t)return o.NextResponse.json({error:"Resume content is required"},{status:400});if(i){let e=await l(i,t,r);return o.NextResponse.json({variants:e})}{let e=await d(t,r);return o.NextResponse.json(e)}}catch(e){return console.error("Variant generation error:",e),o.NextResponse.json({error:"Variant generation failed",details:e instanceof Error?e.message:"Unknown error"},{status:500})}}let h=new s.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/v1/variants/route",pathname:"/api/v1/variants",filename:"route",bundlePath:"app/api/v1/variants/route"},resolvedPagePath:"/Users/asimsinanyuksel/Desktop/ResumeReviewer/app/api/v1/variants/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:x,staticGenerationAsyncStorage:v,serverHooks:f}=h,_="/api/v1/variants/route";function g(){return(0,a.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:v})}},45405:(e,t,r)=>{"use strict";r.d(t,{Dz:()=>s,hz:()=>x,jz:()=>l});var i=r(21067);function s(e,t){let r=e.safeParse(t);if(!r.success)throw console.error("Schema validation failed:",r.error.issues),Error(`Schema validation failed: ${r.error.issues.map(e=>e.message).join(", ")}`);return r.data}let n=i.Ry({overall:i.Rx().min(0).max(100),content:i.Rx().min(0).max(100),formatting:i.Rx().min(0).max(100),keywords:i.Rx().min(0).max(100),impact:i.Rx().min(0).max(100),readability:i.Rx().min(0).max(100),atsCompatibility:i.Rx().min(0).max(100),recruiterAppeal:i.Rx().min(0).max(100)}),a=i.Ry({id:i.Z_(),severity:i.Km(["low","medium","high","critical"]),text:i.Z_(),evidence:i.Z_(),impact:i.Z_()}),o=i.Ry({id:i.Z_(),action:i.Z_(),example:i.Z_(),reasoning:i.Z_()}),c=i.Ry({name:i.Z_(),score:i.Rx().min(0).max(100),details:i.Z_(),issues:i.IX(a),fixes:i.IX(o)}),u=i.Ry({keywordMatches:i.IX(i.Z_()),missingKeywords:i.IX(i.Z_()),syntaxFlags:i.IX(i.Z_()),compatibilityScore:i.Rx().min(0).max(100),parsingIssues:i.IX(i.Z_()),optimizationTips:i.IX(i.Z_())}),p=i.Ry({sixSecondScan:i.Z_(),redFlags:i.IX(i.Z_()),highlights:i.IX(i.Z_()),firstImpression:i.Km(["excellent","good","average","poor"]),scanningPattern:i.Z_(),attentionGrabbers:i.IX(i.Z_()),concerns:i.IX(i.Z_())}),m=i.Ry({id:i.Z_(),impact:i.Km(["low","medium","high"]),difficulty:i.Km(["easy","medium","hard"]),description:i.Z_(),example:i.Z_(),timeToImplement:i.Z_()}),d=i.Ry({elevatorPitch:i.Z_(),priorityFixes:i.IX(m),versioningRecommendation:i.Km(["functional","reverse-chronological","hybrid"]),industryFit:i.Z_(),seniorityLevel:i.Z_()}),l=i.Ry({scores:n,sections:i.IX(c),ats:u,recruiterView:p,summary:d,suggestions:i.IX(i.Ry({id:i.Z_(),text:i.Z_(),evidence:i.Z_(),example:i.Z_(),impact:i.Km(["low","medium","high"])})),strengths:i.IX(i.Ry({id:i.Z_(),text:i.Z_(),evidence:i.Z_(),category:i.Km(["leadership","technical","communication","achievement"])})),improvements:i.IX(i.Ry({id:i.Z_(),text:i.Z_(),evidence:i.Z_(),example:i.Z_(),severity:i.Km(["low","medium","high","critical"])})),metadata:i.Ry({analysisVersion:i.Z_(),generatedAt:i.Z_(),modelUsed:i.Z_(),candidateName:i.Z_().optional(),analysisDepth:i.Z_(),industryContext:i.Z_()})}),y=i.Ry({id:i.Z_(),type:i.Km(["headline","summary","skills","experience"]),content:i.Z_(),rationale:i.Z_()}),h=i.Ry({ranking:i.IX(i.Ry({id:i.Z_(),score:i.Rx().min(0).max(100),reasons:i.IX(i.Z_())})),winner:i.Ry({id:i.Z_(),score:i.Rx()}),improvements:i.IX(i.Ry({variantId:i.Z_(),changes:i.IX(i.Z_())}))}),x=i.Ry({variants:i.IX(y),tournament:h})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),i=t.X(0,[276,972,67,954],()=>r(1928));module.exports=i})();