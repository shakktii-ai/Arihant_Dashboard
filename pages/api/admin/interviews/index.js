// pages/api/admin/interviews/index.js

import mongoose from "mongoose";
import dbConnect from "../../../../lib/db";
import JobInfo from "../../../../models/JobInfo";
import CompanyOnboarding from "../../../../models/CompanyOnboarding";
import CompanyPayment from "../../../../models/CompanyPayment";
import { verifyTokenFromReq } from "../../../../lib/verifyToken";

export default async function handler(req, res) {
  await dbConnect();

  // 🔐 Verify token
  const user = verifyTokenFromReq(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // Always convert once
  const companyId = new mongoose.Types.ObjectId(user.companyId);

  // ============================================================
  // GET — fetch interviews for THIS company only
  // ============================================================
  if (req.method === "GET") {
    try {
      const list = await JobInfo.find({ companyId })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        ok: true,
        interviews: list,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch interviews",
      });
    }
  }

  // ============================================================
  // POST — create new interview
  // ============================================================
  if (req.method === "POST") {
    try {
      const body = req.body || {};

      // 🔹 Validate required fields
      if (
        !body.jobRole ||
        !body.jd ||
        !body.qualification ||
        !body.criteria ||
        !body.location
      ) {
        return res.status(400).json({
          ok: false,
          error: "Missing required fields",
        });
      }

      const questions = {
        totalQuestions: Number(body.questions?.totalQuestions || 60),
        aptitude: Number(body.questions?.aptitude || 0),
        technical: Number(body.questions?.technical || 0),
      };

      const sum = questions.aptitude + questions.technical;

      if (sum !== questions.totalQuestions) {
        return res.status(400).json({
          ok: false,
          error: `Question count mismatch: aptitude + technical must equal totalQuestions (${questions.totalQuestions})`,
        });
      }

      // ============================================================
// 💳 CREDIT CHECK (FINAL CLEAN VERSION)
// ============================================================

const CompanyOnboarding = (await import("../../../../models/CompanyOnboarding")).default;
const CompanyPayment = (await import("../../../../models/CompanyPayment")).default;

const companyId = user.companyId; // ⚠️ DO NOT convert

// Fetch onboarding (OLD credits)
const onboarding = await CompanyOnboarding.findOne({
  companyId: companyId,
}).lean();

// Fetch latest payment (NEW credits)
const payment = await CompanyPayment.findOne({
  companyId: companyId,
})
  .sort({ createdAt: -1 })
  .lean();

console.log("Onboarding credits:", onboarding?.creditsRemaining);
console.log("Payment credits:", payment?.creditsRemaining);

let creditSource = null;
let availableCredits = 0;

// Payment priority
if (payment?.creditsRemaining > 0) {
  creditSource = "payment";
  availableCredits = payment.creditsRemaining;
}
// Fallback to onboarding
else if (onboarding?.creditsRemaining > 0) {
  creditSource = "onboarding";
  availableCredits = onboarding.creditsRemaining;
}

if (!creditSource) {
  return res.status(403).json({
    ok: false,
    error: "Insufficient credits. Please buy credits to create new interviews.",
  });
}

      // ============================================================
      // ✅ CREATE INTERVIEW
      // ============================================================

      const job = await JobInfo.create({
        companyId,
        jobRole: body.jobRole,
        jd: body.jd,
        qualification: body.qualification,
        criteria: body.criteria,
        location: body.location,
        questions,
        isActive: true,
      });

      // ============================================================
      // ➖ DEDUCT 1 CREDIT
      // ============================================================
console.log("Deducting from:", creditSource);
console.log("CompanyId used for deduction:", companyId);
      if (creditSource === "payment") {
        await CompanyPayment.findOneAndUpdate(
          { companyId },
          { $inc: { creditsRemaining: -1 } }
        );
      } else if (creditSource === "onboarding") {
        await CompanyOnboarding.findOneAndUpdate(
          { companyId },
          { $inc: { creditsRemaining: -1 } }
        );
      }

      return res.status(201).json({
        ok: true,
        job,
        creditsRemaining: availableCredits - 1,
      });

    } catch (err) {
      console.error("Create Interview Error:", err);
      return res.status(500).json({
        ok: false,
        error: err.message,
      });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({
    ok: false,
    error: `Method ${req.method} Not Allowed`,
  });
}
