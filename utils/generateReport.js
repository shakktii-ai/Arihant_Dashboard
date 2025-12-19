// // /utils/generateReport.js

// async function getApiResponseReport(data) {
//   const url = 'https://api.openai.com/v1/chat/completions';
//   const headers = {
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//   };

//   const prompt = `Generate a comprehensive interview report scoring (0-10) technical proficiency, communication, decision-making, confidence, language fluency and overall (0-50). Analyze: ${JSON.stringify(data, null, 2)}. Provide detailed feedback with improvement areas and recommendations.`;

//   const payload = {
//     model: "gpt-4",
//     temperature: 0.7,
//     max_tokens: 1000,
//     messages: [{ role: "user", content: prompt }],
//   };

//   try {
//     const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
//     const responseData = await response.json();
//     if (response.ok && responseData?.choices?.[0]?.message?.content) {
//       return responseData.choices[0].message.content;
//     } else {
//       console.error('LLM error:', responseData);
//       return null;
//     }
//   } catch (error) {
//     console.error('Error calling LLM:', error);
//     return null;
//   }
// }

// export async function generateAndSaveReport(interviewData, candidate) {
//   try {
//     // 1) Prepare comprehensive data for report
//     const analysisData = {
//       jobRole: interviewData.jobInfo?.jobRole,
//       candidate: {
//         name: candidate?.name,
//         email: candidate?.email,
//       },
//       answers: {},
//     };

//     // 2) Process all answers
//     for (const answer of interviewData.answers) {
//       if (answer.section === 'apti') {
//         // MCQ answer - use selectedOptionIndex
//         const question = interviewData.generatedQuestions.aptitude[answer.questionIndex];
//         analysisData.answers[`apti_${answer.questionIndex}`] = {
//           question: question?.prompt,
//           answer: question?.options[answer.response],
//           isCorrect: answer.response === question?.correctOptionIndex,
//         };
//       } else {
//         // Voice answer - transcribe audio
//         let transcription = answer.response || ""; // use stored client transcript first

//         // only transcribe server-side if client transcript is missing/empty
//         if (!transcription || transcription.trim().length < 10) {
//           transcription = await transcribeAudio(answer.audioPath);
//         }
//         const question = interviewData.generatedQuestions[answer.section][answer.questionIndex];
//         analysisData.answers[`${answer.section}_${answer.questionIndex}`] = {
//           question: question?.prompt,
//           transcribedAnswer: transcription,
//         };
//       }
//     }

//     // 3) Generate report with complete data
//     const report = await getApiResponseReport(analysisData);
//     if (!report) throw new Error('Failed to generate report');
// console.log('Generated Report:',report);
//     // 4) Store report
//     const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
//     await fetch(`${baseUrl}/api/saveAndGetReport`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         role: interviewData.jobInfo?.jobRole || 'Unknown Role',
//         email: candidate?.email,
//         collageName: candidate?.collegeName || 'Unknown College',
//         reportAnalysis: report,
//       }),
//     }).catch(err => console.error('Failed to store report:', err));

//     return { ok: true, report };
//   } catch (err) {
//     console.error('generateAndSaveReport error:', err);
//     return { ok: false, error: err.message };
//   }
// }

//utils/generateReport.js
import Report from "../models/Report";

async function getAIReport(analysisData,job) {
  const url = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
  };

 const prompt = `You are an expert interview evaluator for modern Indian workplace hiring.

You are given a candidate’s responses from a simulated hiring assessment consisting of:
- aptitude (MCQs)
- technical (voice-based technical answers)
- softskill (behavioral and situational answers)

You are also given company context to judge real-world role alignment.

Your task is to generate a STRICT, FAIR, DATA-AWARE evaluation.
You MUST account for assessment completeness and section coverage.

--------------------------------------------------
CRITICAL COMPLETENESS DATA (DO NOT IGNORE):
- answeredCount: ${analysisData.answeredCount}
- totalQuestions: ${analysisData.totalQuestions}

Compute:
completionRatio = answeredCount / totalQuestions
--------------------------------------------------

RETURN STRICT JSON ONLY in the exact structure below:

{
  "scores": {
    "technicalProficiency": <0-10>,
    "communication": <0-10>,
    "decisionMaking": <0-10>,
    "confidence": <0-10>,
    "languageFluency": <0-10>,
    "culturalFit": <0-10>
  },
  "overallScore": <0-60>,
  "personalityType": {
    "label": "",
    "description": ""
  },
  "culturalFit": {
    "summary": "",
    "alignment": "High" | "Moderate" | "Low"
  },
  "roleFit": {
    "match": "High" | "Medium" | "Low",
    "explanation": ""
  },
  "evaluationText": {
    "technicalProficiency": "",
    "communication": "",
    "decisionMaking": "",
    "confidence": "",
    "languageFluency": "",
    "culturalFit": "",
    "overallSummary": ""
  },
  "improvementResources": {
    "technicalProficiency": [],
    "communication": [],
    "decisionMaking": [],
    "confidence": [],
    "languageFluency": [],
    "culturalFit": []
  },
  "recommendation": "Proceed" | "Borderline" | "Cannot Proceed"
}

--------------------------------------------------
SCORING RULES (MANDATORY):
- Each score must be an integer between 0 and 10
- overallScore = sum of all 6 category scores (max 60)

--------------------------------------------------
COMPLETENESS GATING (STRICT – MUST FOLLOW):

1️⃣ If completionRatio < 0.25:
- overallScore MUST be ≤ 15
- recommendation MUST be "Cannot Proceed"
- roleFit.match MUST be "Low"
- culturalFit.alignment MUST be "Low"
- Clearly mention "assessment incomplete" in evaluationText.overallSummary

2️⃣ If completionRatio >= 0.25 AND < 0.5:
- overallScore MUST be ≤ 30
- recommendation CANNOT be "Proceed"
- roleFit.match MUST be "Low" or "Medium"

3️⃣ Only if completionRatio >= 0.5:
- Normal evaluation is allowed

--------------------------------------------------
SECTION-WISE SCORING RULES:

- technicalProficiency:
  - Must be based ONLY on technical answers
  - If fewer than 30% of technical questions are answered → score MUST be ≤ 3

- communication, confidence, languageFluency:
  - Must be based ONLY on softskill + voice responses
  - If softskill answers are missing or very few → scores MUST be ≤ 3

- decisionMaking:
  - Must reflect aptitude accuracy and reasoning
  - Sparse or weak aptitude responses → score MUST be ≤ 4

- culturalFit:
  - If softskill responses are missing → alignment MUST be "Low"

--------------------------------------------------
EVALUATION RULES:
- Do NOT assume competence from silence or missing data
- Absence of evidence is NOT evidence of skill
- Be conservative when data is limited
- Judge clarity, not accent
- Judge depth relative to experience level
- Cultural fit must reflect Indian workplace realities:
  hierarchy, ownership, deadlines, manager expectations

--------------------------------------------------
RECOMMENDATION LOGIC (STRICT):
- overallScore ≥ 40 AND completionRatio ≥ 0.5 → "Proceed"
- 25–39 → "Borderline"
- < 25 → "Cannot Proceed"

--------------------------------------------------
JOB CONTEXT:
- Job Role: ${job.jobRole}
- JD: ${job.jd}
- Qualification: ${job.qualification}
- Criteria: ${job.criteria}
- Industry: ${job.industry}
- Company Type: ${job.companyType}
- Office Location: ${job.location}
- Target Market: ${job.targetMarket}
- Sample Clients: ${job.clients?.join(", ") || "N/A"}

--------------------------------------------------
INTERVIEW DATA:
${JSON.stringify(analysisData, null, 2)}

REMEMBER:
- Output VALID JSON ONLY
- No markdown
- No explanations
- No assumptions beyond provided data
`;
 const payload = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: "Return ONLY valid JSON. No explanation." },
      { role: "user", content: prompt }
    ]
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || "{}";

 try {
  const report = JSON.parse(text);

  if (report?.scores) {
    for (const key in report.scores) {
      report.scores[key] = Number(report.scores[key] || 0);
    }
  }

  report.overallScore = Number(report.overallScore || 0);

  return report;
} catch (err) {
  console.error("AI JSON Parse Failed:", text);
  return null;
}

}
// MAIN REPORT FUNCTION
export async function generateAndSaveReport(session, candidate) {
  try {
    const job = session.jobInfo;
    if (!job) {
  throw new Error("Job context missing for report generation");
}

    const analysisData = {
  jobRole: job.jobRole,
  criteria: job.criteria,
  industry: job.industry,
  companyType: job.companyType,
  location: job.location,
  targetMarket: job.targetMarket,
  candidate: {
    name: candidate?.name,
    email: candidate?.email,
  },
  answers: {}
};


    const totalQuestions =
      (session.generatedQuestions?.aptitude?.length || 0) +
      (session.generatedQuestions?.technical?.length || 0) +
      (session.generatedQuestions?.softskill?.length || 0);

    const answeredCount = session.answers.length;

    analysisData.answeredCount = answeredCount;
    analysisData.totalQuestions = totalQuestions;

    // Build answer details for AI
   for (const ans of session.answers) {
  const section = ans.section;

  // Fix mismatched keys
  const map = {
    apti: "aptitude",
    aptitude: "aptitude",
    technical: "technical",
    softskill: "softskill",
    soft: "softskill"
  };

  const corrected = map[section] || section;

  const q = session.generatedQuestions?.[corrected]?.[ans.questionIndex] || {};

  let answerText = "";
  if (corrected === "aptitude") {
    answerText = q?.options?.[ans.response] || "(no answer)";
  } else {
    answerText = ans.response || "";
  }

  analysisData.answers[`${corrected}_${ans.questionIndex}`] = {
    question: q?.prompt || "",
    answer: answerText
  };
}


    // Generate report using AI
    const report = await getAIReport(analysisData,job);
    if (!report) throw new Error("AI report generation failed");

    // ---------------------------
    // ⭐ SAVE REPORT WITH COMPANY ID
    // ---------------------------
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
await Report.create({
  companyId: session.companyId,
  role: session.jobInfo?.jobRole || "Unknown Role",
  email: candidate?.email,
  
  reportAnalysis: report,
  sessionId: session._id
});
   

    // Save inside session too if needed
    session.report = report;
    session.reportGenerated = true;
    await session.save();

    return { ok: true, report };

  } catch (err) {
    console.error("generateAndSaveReport error:", err);
    return { ok: false, error: err.message };
  }
}
