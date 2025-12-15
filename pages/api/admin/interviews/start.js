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





// pages/api/admin/interview/start.js
import dbConnect from "../../../../lib/db";
import JobInfo from "../../../../models/JobInfo";
import InterviewSession from "../../../../models/InterviewSession";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST")
    return res.status(405).json({ ok: false, detail: "Only POST allowed" });

  const { slug, candidate } = req.body;
  if (!slug || !candidate)
    return res.status(400).json({ ok: false, detail: "Missing data" });

  // -----------------------------
  // 1. Find job by slug
  // -----------------------------
  const job = await JobInfo.findOne({ slug, isActive: true });

  if (!job)
    return res.status(404).json({ ok: false, detail: "Interview not found or inactive" });

  // IMPORTANT: job MUST contain companyId
  const companyId = job.companyId;

  if (!companyId)
    return res.status(500).json({
      ok: false,
      detail: "Job is missing companyId — multi-company setup invalid",
    });

  // -----------------------------
  // 2. Generate questions using OpenAI
  // -----------------------------
  const prompt = buildPrompt(job);
  const openaiResp = await callOpenAI(prompt);

  let parsed;
  try {
    let jsonStr = extractJson(openaiResp);
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    console.error("OpenAI JSON Parse Failed:", openaiResp);
    return res.status(500).json({
      ok: false,
      detail: "Failed to parse generated questions",
      error: err.message,
    });
  }

  if (!parsed.aptitude || !parsed.technical || !parsed.softskill) {
    return res.status(500).json({
      ok: false,
      detail: "Invalid question structure from OpenAI",
    });
  }

  // -----------------------------
  // 3. Create interview session
  // -----------------------------
  const session = new InterviewSession({
    companyId,                 // ⭐ CRUCIAL FOR MULTI-COMPANY
    jobInfo: job._id,
    slug: job.slug,
    candidate,
    generatedQuestions: parsed,
    status: "in-progress",
  });

  await session.save();

  const instructionsUrl = `/interview/${job.slug}/instructions?sessionId=${session._id}`;

  return res.status(201).json({
    ok: true,
    sessionId: session._id,
    instructionsUrl,
    generated: parsed,
  });
}

/* UTILITIES */

function extractJson(str) {
  let s = str.trim();

  if (s.includes("```json")) {
    return s.split("```json")[1].split("```")[0].trim();
  }
  if (s.includes("```")) {
    return s.split("```")[1].split("```")[0].trim();
  }

  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1) return s.substring(start, end + 1);

  return s; // fallback
}

function buildPrompt(job) {
  const aptiCount = job.questions.apti || job.questions.aptitude || Math.ceil(job.questions.totalQuestions * 0.33);
  const technicalCount = job.questions.technical;
  const softCount = job.questions.softskill;

  return `You are a question generator for interviews. Output ONLY valid JSON with this exact structure:
{
  "aptitude": [{"prompt":"..", "options":["A","B","C","D"], "correctOptionIndex":0}, ...],
  "technical": [{"prompt":"..", "hint":".."}, ...],
  "softskill": [{"prompt":".."}, ...]
}

Job Role: ${job.jobRole}
JD: ${job.jd}
Qualification: ${job.qualification}
Criteria: ${job.criteria}
Total questions: ${job.questions.totalQuestions}
Distribution: aptitude ${aptiCount}, technical ${technicalCount}, softskill ${softCount}

Requirements:
- Aptitude items: crisp multiple choice with 4 options; include correctOptionIndex (0-3).
- Technical items: short prompts suitable for voice answers (60-90 seconds).
- Softskill items: behavioral interview prompts for voice answers.
- Return ONLY the JSON object, no markdown, no code blocks, no extra text.`;
}

async function callOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OpenAI key");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You generate only valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "OpenAI error");

  return data.choices?.[0]?.message?.content || "";
}
