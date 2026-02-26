import Report from "../models/Report";
import CompanyOnboarding from "../models/CompanyOnboarding";
/* ================= AI CALL ================= */

async function getAIReport(analysisData, job, companyOnboarding) {
  const url = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  };

  const prompt = `
You are an expert interview evaluator for modern Indian workplace hiring.

Assessment structure:
- Aptitude (MCQ)
- Technical (MCQ + written descriptive answers)
- Behavioral & Psychometric (OCEAN-based)

You are given job and company context ONLY to understand role expectations — 
DO NOT assume undocumented company culture.

Your task is to generate a clear, structured, and explainable evaluation of the candidate’s suitability:
- Technical
- Behavioral
- Personality-to-role alignment (OCEAN → JD)

--------------------------------------------------
CRITICAL COMPLETENESS DATA:
- answeredCount: ${analysisData.answeredCount}
- totalQuestions: ${analysisData.totalQuestions}

completionRatio = answeredCount / totalQuestions
--------------------------------------------------

RETURN STRICT JSON ONLY in this structure:

{
  "scores": {
    "technicalProficiency": <0-10>,
    "communication": <0-10>,
    "decisionMaking": <0-10>,
    "confidence": <0-10>,
    "languageFluency": <0-10>,
    "personalityRoleFit": <0-10>
  },
  "overallScore": <0-60>,
  "personalityType": {
    "oceanProfile": {
      "openness": "High | Medium | Low",
      "conscientiousness": "High | Medium | Low",
      "extraversion": "High | Medium | Low",
      "agreeableness": "High | Medium | Low",
      "neuroticism": "High | Medium | Low"
    },
    "summary": ""
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
    "personalityRoleFit": "",
    "overallSummary": ""
  },
  "improvementResources": {
    "technicalProficiency": [],
    "communication": [],
    "decisionMaking": [],
    "confidence": [],
    "languageFluency": [],
    "personalityRoleFit": []
  },
  "recommendation": "Proceed" | "Borderline" | "Cannot Proceed"
}

--------------------------------------------------
SCORING RULES:
- Scores must be integers 0–10
- overallScore = sum of all 6 scores (max 60)

IMPORTANT:
If completionRatio < 0.5, recommendation CANNOT be "Proceed" regardless of score.

Recommendation Logic:
- overallScore ≥ 40 → "Proceed"
- 25–39 → "Borderline"
- < 25 → "Cannot Proceed"

--------------------------------------------------
EVALUATION RULES:

- technicalProficiency → technical MCQs + written answers
- decisionMaking → aptitude accuracy + reasoning quality
- communication / confidence / languageFluency → inferred from written responses
- personalityRoleFit → inferred using OCEAN traits mapped to JD needs

Personality Evaluation (NON-clinical):
- Openness → adaptability, learning, problem-solving
- Conscientiousness → ownership, reliability, execution
- Extraversion → stakeholder interaction, assertiveness
- Agreeableness → teamwork, conflict handling
- Neuroticism → stress tolerance, ambiguity handling

ROLE FIT MUST BE BASED ON:
- Job Role & JD expectations
- Experience level (entry / mid / senior)
- Industry norms (e.g., fintech = compliance focus, IT = clarity)
- Target market (enterprise, SME, public sector, consumer)
- Client expectations (e.g., HDFC = structured, Flipkart = fast-paced)

DO NOT:
- Assume undocumented company culture
- Penalize for missing data — instead lower score and explain

Indian workplace context to consider:
- deadlines, hierarchy awareness, ownership mindset
- ambiguity, pressure, cross-functional coordination

--------------------------------------------------
JOB CONTEXT:
- Role: ${job.jobRole}
- JD: ${job.jd}
- Criteria: ${job.criteria}
- Industry: ${companyOnboarding.industry}
- Location: ${job.location}
- Company Type: ${companyOnboarding.companyType}
- Target Market: ${companyOnboarding.targetMarket}
- Sample Clients: ${companyOnboarding.sampleClients?.join(", ") || "N/A"}

--------------------------------------------------
INTERVIEW DATA:
${JSON.stringify(analysisData, null, 2)}

Output VALID JSON only.
`;

  const payload = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: "Return ONLY valid JSON." },
      { role: "user", content: prompt },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || "{}";

  try {
    const report = JSON.parse(text);

    for (const k in report.scores) {
      report.scores[k] = Number(report.scores[k] || 0);
    }
    report.overallScore = Number(report.overallScore || 0);

    return report;
  } catch (err) {
    console.error("AI JSON parse failed:", text);
    return null;
  }
}

/* ================= MAIN REPORT GENERATOR ================= */

export async function generateAndSaveReport(session, candidate) {
  try {
    const job = session.jobInfo;
    if (!job) throw new Error("Job context missing");
    const companyOnboarding = await CompanyOnboarding.findOne({
      companyId: session.companyId,
      $or: [
        { isCompleted: true }, // old onboarding records
        { isActive: true },    // new onboarding records
      ],
    }).lean();

    if (!companyOnboarding) {
      throw new Error("Company onboarding data missing");
    }
    const analysisData = {
      jobRole: job.jobRole,
      criteria: job.criteria,
      industry: companyOnboarding.industry,
      companyType: companyOnboarding.companyType,
      location: job.location,
      targetMarket: companyOnboarding.targetMarket,
      candidate: {
        name: candidate?.name,
        email: candidate?.email,
      },
      answers: {},
    };

    /* ========= FIX 1: Correct total questions ========= */
    const totalQuestions =
      (session.generatedQuestions?.aptitude?.length || 0) +
      (session.generatedQuestions?.technical?.mcq?.length || 0) +
      (session.generatedQuestions?.technical?.written?.length || 0);

    const answeredCount = session.answers.length;

    analysisData.totalQuestions = totalQuestions;
    analysisData.answeredCount = answeredCount;

    /* ========= FIX 2: Correct answer mapping ========= */
    for (const ans of session.answers) {
      let q = {};
      let answerText = "";

      if (ans.section === "apti") {
        q = session.generatedQuestions.aptitude?.[ans.questionIndex];
        answerText = q?.options?.[ans.response] || "(no answer)";
      }

      if (ans.section === "technical") {
        // MCQ
        if (typeof ans.response === "number") {
          q =
            session.generatedQuestions.technical.mcq?.[
            ans.questionIndex
            ];
          answerText = q?.options?.[ans.response] || "(no answer)";
        }

        // WRITTEN
        if (typeof ans.response === "string") {
          q =
            session.generatedQuestions.technical.written?.[
            ans.questionIndex
            ];
          answerText = ans.response;
        }
      }

      analysisData.answers[`${ans.section}_${ans.questionIndex}`] = {
        question: q?.prompt || "",
        answer: answerText,
      };
    }

    /* ========= AI REPORT ========= */
    const report = await getAIReport(analysisData, job, companyOnboarding);
    if (!report) throw new Error("AI report generation failed");

    /* ========= SAVE REPORT ========= */
    await Report.create({
      companyId: session.companyId,
      role: job.jobRole,
      email: candidate?.email,
      reportAnalysis: report,
      sessionId: session._id,
    });

    session.report = report;
    session.reportGenerated = true;
    await session.save();

    return { ok: true, report };
  } catch (err) {
    console.error("generateAndSaveReport error:", err);
    return { ok: false, error: err.message };
  }
}
