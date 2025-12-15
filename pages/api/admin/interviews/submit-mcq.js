// pages/api/interview/submit-mcq.js
import dbConnect from "../../../../lib/db";
import InterviewSession from "../../../../models/InterviewSession";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Only POST allowed" });
  }

  const { sessionId, answers, isComplete } = req.body;

  if (!sessionId || !Array.isArray(answers)) {
    return res.status(400).json({ ok: false, error: "Missing or invalid data" });
  }

  const session = await InterviewSession.findById(sessionId);

  if (!session) {
    return res.status(404).json({ ok: false, error: "Session not found" });
  }

  // Prevent adding answers to completed session
  if (session.status === "completed") {
    return res.status(400).json({
      ok: false,
      error: "Session already completed. Cannot submit answers.",
    });
  }

  // ---------------------------------------------
  // Remove previous aptitude answers if resubmit
  // ---------------------------------------------
  session.answers = session.answers.filter((a) => a.section !== "apti");

  // ---------------------------------------------
  // Store new aptitude answers
  // ---------------------------------------------
  answers.forEach((a) => {
    if (
      typeof a.questionIndex === "number" &&
      typeof a.selectedOptionIndex === "number"
    ) {
      session.answers.push({
        section: "apti",
        questionIndex: a.questionIndex,
        response: a.selectedOptionIndex,
      });
    }
  });

  // ---------------------------------------------
  // Mark session complete if needed
  // ---------------------------------------------
  if (isComplete) {
    session.status = "completed";
    session.completedAt = new Date();
  }

  await session.save();

  return res.status(200).json({ ok: true, sessionId });
}
