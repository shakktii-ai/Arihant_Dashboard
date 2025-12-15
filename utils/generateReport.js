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


import Report from "../models/Report";

async function getAIReport(analysisData) {
  const url = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
  };

  const prompt = `You are an expert interview evaluator. Produce a professional evaluation with
numeric scoring similar to:

- Technical Proficiency: 3/10
- Communication: 2/10
- Decision-making: 2/10
- Confidence: 3/10
- Language Fluency: 3/10
- Overall: 13/50

Return STRICT JSON in this exact structure:

{
  "scores": {
    "technicalProficiency": <0-10>,
    "communication": <0-10>,
    "decisionMaking": <0-10>,
    "confidence": <0-10>,
    "languageFluency": <0-10>
  },

  "overallScore": <0-50>,

  "evaluationText": {
    "technicalProficiency": "",
    "communication": "",
    "decisionMaking": "",
    "confidence": "",
    "languageFluency": "",
    "overallSummary": ""
  },

  "improvementResources": {
    "technicalProficiency": [],
    "communication": [],
    "decisionMaking": [],
    "confidence": [],
    "languageFluency": []
  },
   "recommendation": "" 
}

Rules:
- ALWAYS give a score out of 10 for each category.
- overallScore = sum of the 5 category scores (max 50).
- Recommendation logic:
    • If overall.score >= 25 → "Proceed"
    • If 16–24 → "Borderline"
    • If < 15 → "Cannot Proceed" depending on data completeness.

- The text must be factual, professional.
- If data is missing → give a low score but mention insufficient information.
- No extra text outside JSON.
Interview Data:
${JSON.stringify(analysisData, null, 2)}
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
    return JSON.parse(text);
  } catch (err) {
    console.error("AI JSON Parse Failed:", text);
    return null;
  }
}
// MAIN REPORT FUNCTION
export async function generateAndSaveReport(session, candidate) {
  try {
    const analysisData = {
      jobRole: session.jobInfo?.jobRole || "Unknown Role",
      candidate: {
        name: candidate?.name,
        email: candidate?.email,
        collegeName: candidate?.collegeName || "Unknown College"
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
    const report = await getAIReport(analysisData);
    if (!report) throw new Error("AI report generation failed");

    // ---------------------------
    // ⭐ SAVE REPORT WITH COMPANY ID
    // ---------------------------
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
await Report.create({
  companyId: session.companyId,
  role: session.jobInfo?.jobRole || "Unknown Role",
  email: candidate?.email,
  collageName: candidate?.collegeName || "Unknown College",
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
