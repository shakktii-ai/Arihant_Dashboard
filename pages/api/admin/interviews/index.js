// pages/api/admin/interviews/index.js
import dbConnect from "../../../../lib/db";
import JobInfo from "../../../../models/JobInfo";
import { verifyTokenFromReq } from "../../../../lib/verifyToken"; // ✅ IMPORT FIXED

export default async function handler(req, res) {
  await dbConnect();

  // --------------------------------------------------
  // 🔐 Get user from token (adminId + companyId)
  // --------------------------------------------------
  const user = verifyTokenFromReq(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const companyId = user.companyId;

  // ============================================================
  // GET — fetch interviews for THIS company only
  // ============================================================
  if (req.method === "GET") {
    try {
      const list = await JobInfo.find({ companyId })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({ ok: true, interviews: list });
    } catch (err) {
      return res.status(500).json({ ok: false, error: "Failed to fetch interviews" });
    }
  }

  // ============================================================
  // POST — create new interview
  // ============================================================
  if (req.method === "POST") {
    try {
      const body = req.body || {};

      // validate minimal required fields
      if (
        !body.jobRole ||
        !body.jd ||
        !body.qualification ||
        !body.criteria ||
        !body.location

      ) {
        return res.status(400).json({ ok: false, error: "Missing required fields" });
      }

      const questions = {
        totalQuestions: Number(body.questions?.totalQuestions || 60),
        aptitude: Number(body.questions?.aptitude || 0),
        technical: Number(body.questions?.technical || 0),
        // softskill: Number(body.questions?.softskill || 0),
      };
      const sum = questions.aptitude + questions.technical;
      if (sum !== questions.totalQuestions) {
        return res.status(400).json({
          ok: false,
          error: `Question count mismatch: aptitude + technical must equal totalQuestions (${questions.totalQuestions})`,
        });
      }

      // --------------------------------------------------
      // 💳 CREDIT CHECK & DEDUCTION
      // --------------------------------------------------
      const CompanyOnboarding = (await import("../../../../models/CompanyOnboarding")).default;
      const onboarding = await CompanyOnboarding.findOne({ companyId });

      if (!onboarding) {
        return res.status(403).json({ ok: false, error: "Company onboarding not completed" });
      }

      if (onboarding.creditsRemaining <= 0) {
        return res.status(403).json({
          ok: false,
          error: "Insufficient credits. Please contact support or recharge to create new interviews."
        });
      }

      const payload = {
        companyId, // 🔐 from token
        jobRole: body.jobRole,
        jd: body.jd,
        qualification: body.qualification,
        criteria: body.criteria,
        location: body.location,

        questions,
        isActive: true,
      };

      const job = await JobInfo.create(payload);

      // ✅ Deduct 1 credit
      await CompanyOnboarding.findOneAndUpdate(
        { companyId },
        { $inc: { creditsRemaining: -1 } }
      );

      return res.status(201).json({ ok: true, job, creditsRemaining: onboarding.creditsRemaining - 1 });
    } catch (err) {
      console.error("Create Interview Error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // Fallback
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ ok: false, error: `Method ${req.method} Not Allowed` });
}
