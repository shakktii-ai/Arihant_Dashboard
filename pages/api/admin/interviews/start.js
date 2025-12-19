// // pages/api/interview/start.js
// import dbConnect from "../../../../middleware/db";
// import JobInfo from "../../../../models/JobInfo";
// import InterviewSession from "../../../../models/InterviewSession";

// export default async function handler(req, res) {
//   await dbConnect();

//   if (req.method !== "POST") return res.status(405).json({ ok: false, detail: "Only POST" });

//   const { slug, candidate } = req.body;
//   if (!slug || !candidate) return res.status(400).json({ ok: false, detail: "missing data" });

//   const job = await JobInfo.findOne({ slug, isActive: true });
//   if (!job) return res.status(404).json({ ok: false, detail: "Interview not found or inactive" });

//   // Build prompt to OpenAI to generate questions according to job.questions distribution
//   const prompt = buildPrompt(job);

//   // Call OpenAI (server-side). Replace with your preferred model.
//   const openaiResp = await callOpenAI(prompt);

//   // The OpenAI response is expected to be JSON — we will try to parse.
//   let parsed;
//   try {
//     // Try to extract JSON if it's wrapped in markdown code blocks or extra text
//     let jsonStr = openaiResp.trim();
    
//     // Remove markdown code blocks if present
//     if (jsonStr.includes("```json")) {
//       jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
//     } else if (jsonStr.includes("```")) {
//       jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
//     }
    
//     parsed = JSON.parse(jsonStr);
//   } catch (e) {
//     console.error("OpenAI returned non-json:", openaiResp);
//     return res.status(500).json({ ok: false, detail: "Failed to parse generated questions", error: e.message, raw: openaiResp.substring(0, 500) });
//   }

//   // Save session
//   const session = new InterviewSession({
//     jobInfo: job._id,
//     slug: job.slug,
//     candidate,
//     generatedQuestions: parsed,
//     status: "in-progress",
//   });

//   await session.save();

//   const instructionsUrl = `/interview/${job.slug}/instructions?sessionId=${session._id}`;

//   res.status(201).json({ ok: true, sessionId: session._id, instructionsUrl, generated: parsed });
// }

// /* Helper: prompt builder */
// function buildPrompt(job) {
//   // We'll request JSON with three arrays: aptitude (MCQ), technical (voice prompts), softskill (voice prompts)
//   const aptiCount = job.questions.apti || job.questions.aptitude || job.questions.totalQuestions * 0.33;
//   const technicalCount = job.questions.technical;
//   const softCount = job.questions.softskill;

//   return `
// You are a question generator for interviews. Output ONLY valid JSON (no markdown, no extra text, no code blocks) with this exact structure:
// {
//   "aptitude": [{"prompt":"..", "options":["A","B","C","D"], "correctOptionIndex":0}, ...],
//   "technical": [{"prompt":"..", "hint":".."}, ...],
//   "softskill": [{"prompt":".."}, ...]
// }

// Job Role: ${job.jobRole}
// JD: ${job.jd}
// Qualification: ${job.qualification}
// Criteria: ${job.criteria}
// Total questions: ${job.questions.totalQuestions}
// Distribution: aptitude ${aptiCount}, technical ${technicalCount}, softskill ${softCount}

// Requirements:
// - Aptitude items: crisp multiple choice with 4 options; include reasonable correctOptionIndex (0-3).
// - Technical items: short prompts suitable for a voice answer (expected 60-90 seconds).
// - Softskill items: prompts for voice answers (behavioural questions).
// - Ensure JSON is valid and parseable.
// - DO NOT include markdown code blocks (no \`\`\`).
// - DO NOT include any text before or after the JSON.
// - Produce EXACTLY the JSON structure described, nothing else.
//   `;
// }

// /* Helper: call OpenAI */
// async function callOpenAI(prompt) {
//   const OPENAI_KEY = process.env.OPENAI_API_KEY;
//   if (!OPENAI_KEY) throw new Error("Missing OPENAI_API_KEY");

//   // Use fetch to OpenAI chat completions (example using the Chat Completions endpoint)
//   const res = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Authorization": `Bearer ${OPENAI_KEY}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       model: "gpt-4o-mini", // replace with your preferred model
//       messages: [{ role: "system", content: "You are a helpful question generator." }, { role: "user", content: prompt }],
//       temperature: 0.2,
//       max_tokens: 1500,
//     }),
//   });

//   const data = await res.json();
//   if (!res.ok) {
//     console.error("OpenAI error", data);
//     throw new Error(data.error?.message || "OpenAI error");
//   }

//   // get assistant content
//   const content = data.choices?.[0]?.message?.content || "";
//   return content;
// }



//pages/api/admin/intrviews/start.js

import dbConnect from "../../../../lib/db";
import JobInfo from "../../../../models/JobInfo";
import InterviewSession from "../../../../models/InterviewSession";

/* ================= MAIN HANDLER ================= */

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, detail: "Only POST allowed" });
  }

  const { slug, candidate } = req.body;
  if (!slug || !candidate) {
    return res.status(400).json({ ok: false, detail: "Missing data" });
  }

  try {
    /* 1️⃣ FIND JOB */
    const job = await JobInfo.findOne({ slug, isActive: true });
    if (!job) {
      return res.status(404).json({ ok: false, detail: "Interview not found" });
    }

    if (!job.companyId) {
      return res.status(500).json({
        ok: false,
        detail: "Job missing companyId",
      });
    }

    /* 2️⃣ CREATE EMPTY SESSION */
    const session = await InterviewSession.create({
      companyId: job.companyId,
      jobInfo: job._id,
      slug: job.slug,
      candidate,
      generatedQuestions: {
        aptitude: [],
        technical: [],
        softskill: [],
      },
      status: "in-progress",
      questionStatus: "generating",
    });

    /* 3️⃣ RESPOND IMMEDIATELY */
    const instructionsUrl = `/interview/${job.slug}/instructions?sessionId=${session._id}`;

    res.status(201).json({
      ok: true,
      sessionId: session._id,
      instructionsUrl,
      msg: "Interview started. Questions generating.",
    });

    /* 4️⃣ BACKGROUND QUESTION GENERATION */
    generateQuestionsInBackground(job, session._id)
      .then(async () => {
        await InterviewSession.findByIdAndUpdate(session._id, {
          questionStatus: "done",
        });
      })
      .catch(async (err) => {
        console.error("❌ Question generation failed:", err);
        await InterviewSession.findByIdAndUpdate(session._id, {
          questionStatus: "failed",
          questionError: err.message || "Question generation failed",
        });
      });

  } catch (err) {
    console.error("START API ERROR:", err);
    return res.status(500).json({
      ok: false,
      detail: err.message || "Internal Server Error",
    });
  }
}

/* ================= BACKGROUND JOB ================= */

async function generateQuestionsInBackground(job, sessionId) {
  const aptitude = await generateAptitude(job);
  const technical = await generateTechnical(job);
  const softskill = await generateSoftskill(job);

  const combined = {
    aptitude,
    technical,
    softskill,
  };

  await InterviewSession.findByIdAndUpdate(sessionId, {
    generatedQuestions: combined,
  });
}

/* ================= APTITUDE ================= */

async function generateAptitude(job) {
  const aptiCount =
    job.questions.aptitude ||
    Math.ceil(job.questions.totalQuestions * 0.33);

  const prompt = `You are an interview question generator designed to simulate realistic hiring assessments for Indian workplace contexts.
Generate ${aptiCount} aptitude questions.
You must output ONLY valid JSON in the following exact structure:
Return ONLY valid JSON:
{
  "aptitude": [
    {
      "prompt": "",
      "options": ["A","B","C","D"],
      "correctOptionIndex": 0,
      "type": "numerical" | "logical" | "personality" | "attitude"
    }
  ]
}

Context:
- Job Role: ${job.jobRole}
- JD: ${job.jd}
- Qualification: ${job.qualification}
- Criteria (Experience + Level): ${job.criteria}  ← e.g., "3–5 years, mid-level"
- Industry: ${job.industry} ← e.g., Fintech, IT Services, EdTech
- Company Type: ${job.companyType} ← e.g., startup, MNC, PSU, family business
- Location: ${job.location} ← e.g., Bangalore, Tier 2 city
- Target Market: ${job.targetMarket} ← e.g., B2B SaaS, public sector, SME clients
- Sample Clients: ${job.clients} ← e.g., ["HDFC", "Flipkart", "Indian Railways"]

#### Assessment (Merged Aptitude + Psychometric):
- Each item must include:
  - "prompt": the question text
  - "options": 4 choices
  - "correctOptionIndex": integer from 0–3
  - "type": one of:
    - "numerical" → salary math, budget estimation, KM–INR conversion
    - "logical" → pattern, deduction, conditionals
    - "personality" → no correct answer; tests preferences or traits
    - "attitude" → judgment, ethics, time pressure, dealing with failure or conflict
- Questions must reflect **India-based work situations**, adjusted by:
  - Experience level
  - Industry and client type
  - Region/city and local workplace behaviors
- Use culturally accurate names, places, and examples:
  - ₹5,000 bonus, Swiggy launch, train delay, Diwali deadline, Noida office
`;

  const raw = await callOpenAI(prompt);
  const parsed = JSON.parse(extractJson(raw));

  if (!parsed?.aptitude) {
    throw new Error("Invalid aptitude output");
  }

  return parsed.aptitude;
}

/* ================= TECHNICAL ================= */

async function generateTechnical(job) {
  const technicalCount = job.questions.technical;

  const prompt = `You are an interview question generator designed to simulate realistic hiring assessments for Indian workplace contexts.
Generate ${technicalCount} technical interview questions.

Return ONLY valid JSON:
{
  "technical": [
    {
      "prompt": "",
      "hint": ""
    }
  ]
}

Context:
- Job Role: ${job.jobRole}
- JD: ${job.jd}
- Qualification: ${job.qualification}
- Criteria (Experience + Level): ${job.criteria}  ← e.g., "3–5 years, mid-level"
- Industry: ${job.industry} ← e.g., Fintech, IT Services, EdTech
- Company Type: ${job.companyType} ← e.g., startup, MNC, PSU, family business
- Location: ${job.location} ← e.g., Bangalore, Tier 2 city
- Target Market: ${job.targetMarket} ← e.g., B2B SaaS, public sector, SME clients
- Sample Clients: ${job.clients} ← e.g., ["HDFC", "Flipkart", "Indian Railways"]

#### Technical:
- Generate voice-suitable scenario-based prompts (60–90 sec responses)
- Focus on **real problems** from the JD (missed deadlines, team confusion, design decisions)
- Include a "hint" to guide the candidate’s response direction
- Adjust by experience level:
  - Entry: concepts, definitions, basic tech handling
  - Mid-level: applied scenarios, client issues, performance bugs
  - Senior: design trade-offs, architecture, stakeholder management
`;

  const raw = await callOpenAI(prompt);
  const parsed = JSON.parse(extractJson(raw));

  if (!parsed?.technical) {
    throw new Error("Invalid technical output");
  }

  return parsed.technical;
}

/* ================= SOFTSKILL ================= */

async function generateSoftskill(job) {
  const total = job.questions.totalQuestions;

  const aptiCount =
    job.questions.aptitude ||
    Math.ceil(total * 0.33);

  const technicalCount =
    job.questions.technical ||
    Math.ceil(total * 0.42);

  const softCount =
    job.questions.softskill ||
    (total - aptiCount - technicalCount);

  const prompt = `You are an interview question generator designed to simulate realistic hiring assessments for Indian workplace contexts.
Generate ${softCount} softskill interview questions.

Return ONLY valid JSON:
{
  "softskill": [
    {
      "prompt": ""
    }
  ]
}

Context:
- Job Role: ${job.jobRole}
- JD: ${job.jd}
- Qualification: ${job.qualification}
- Criteria (Experience + Level): ${job.criteria}  ← e.g., "3–5 years, mid-level"
- Industry: ${job.industry} ← e.g., Fintech, IT Services, EdTech
- Company Type: ${job.companyType} ← e.g., startup, MNC, PSU, family business
- Location: ${job.location} ← e.g., Bangalore, Tier 2 city
- Target Market: ${job.targetMarket} ← e.g., B2B SaaS, public sector, SME clients
- Sample Clients: ${job.clients} ← e.g., ["HDFC", "Flipkart", "Indian Railways"]

#### Softskill:
- Use behavioral + situational interview prompts
- Base them on **Indian team dynamics and pressure**:
  - Festive deadlines
  - Multi-location coordination (e.g., Pune–Hyderabad)
  - Managing interns and juniors
  - Speaking to senior managers or difficult clients
- Match the challenge to the role seniority
`;

  const raw = await callOpenAI(prompt);
  const parsed = JSON.parse(extractJson(raw));

  if (!parsed?.softskill) {
    throw new Error("Invalid softskill output");
  }

  return parsed.softskill;
}

/* ================= OPENAI CALL ================= */

async function callOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OpenAI API key");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Return ONLY valid JSON." },
        { role: "user", content: prompt },
      ],
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("OpenAI RAW ERROR:", text);
    throw new Error("OpenAI request failed");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("OpenAI NON-JSON RESPONSE:", text);
    throw new Error("Invalid OpenAI JSON");
  }

  return data.choices?.[0]?.message?.content || "";
}

/* ================= JSON EXTRACT ================= */

function extractJson(str) {
  if (!str) return "";

  let s = str.trim();

  if (s.includes("```json")) {
    return s.split("```json")[1].split("```")[0].trim();
  }

  if (s.includes("```")) {
    return s.split("```")[1].split("```")[0].trim();
  }

  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");

  return start !== -1 && end !== -1
    ? s.substring(start, end + 1)
    : s;
}
