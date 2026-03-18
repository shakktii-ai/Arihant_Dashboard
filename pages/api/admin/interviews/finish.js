// pages/api/admin/interviews/finish.js

import dbConnect from "../../../../lib/db";
import InterviewSession from "../../../../models/InterviewSession";
import { generateAndSaveReport } from "../../../../utils/generateReport";
import "../../../../models/JobInfo";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { sessionId } = req.body;

  try {
    const session = await InterviewSession.findById(sessionId).populate("jobInfo");

    if (!session) {
      return res.status(404).json({ ok: false, error: "Session not found" });
    }

    // -------------------------
    // Prevent duplicate report
    // -------------------------
    if (session.reportGenerated) {
      return res.status(200).json({
        ok: true,
        msg: "Report already generated",
      });
    }

    // -------------------------
    // Mark completed
    // -------------------------
    session.status = "completed";
    session.completedAt = new Date();
    session.reportStatus = "generating";
    await session.save();

    // -------------------------
    // 🔥 IMPORTANT: WAIT for report
    // -------------------------
    const result = await generateAndSaveReport(session, session.candidate);

    if (!result.ok) {
      session.reportStatus = "failed";
      await session.save();

      return res.status(500).json({
        ok: false,
        error: "Report generation failed",
      });
    }

    // -------------------------
    // Mark done
    // -------------------------
    session.reportGenerated = true;
    session.reportStatus = "done";
    await session.save();

    return res.status(200).json({
      ok: true,
      msg: "Report generated successfully",
    });

  } catch (err) {
    console.error("Finish interview error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}