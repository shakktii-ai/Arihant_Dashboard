import dbConnect from "../../../../lib/db";
import CompanyOnboarding from "../../../../models/CompanyOnboarding";
import Company from "../../../../models/company";
import { verifyTokenFromReq } from "../../../../lib/verifyToken";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const token = verifyTokenFromReq(req);
      if (!token) return res.status(401).json({ ok: false, error: "Unauthorized" });

      let onboarding = await CompanyOnboarding.findOne({ companyId: token.companyId }).lean();

      // If onboarding exists but credits are missing/zero (for existing users), default to 5
      if (onboarding && (onboarding.creditsRemaining === undefined || onboarding.creditsRemaining === null)) {
        onboarding.creditsRemaining = 5;
        await CompanyOnboarding.updateOne({ _id: onboarding._id }, { $set: { creditsRemaining: 5 } });
      }

      return res.status(200).json({ ok: true, onboarding });
    } catch (err) {
      return res.status(500).json({ ok: false, error: "Failed to fetch onboarding info" });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const token = verifyTokenFromReq(req);
    if (!token) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const companyId = token.companyId;
    const body = req.body;

    if (!companyId || !body.industry || !body.companyType) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    // Save or update onboarding
    await CompanyOnboarding.findOneAndUpdate(
      { companyId },
      {
        companyId,
        ...body,
        sampleClients: body.sampleClients
          ? body.sampleClients.split(",").map((c) => c.trim())
          : [],
        creditsRemaining: 5, // Initialize with 5 credits as requested
        paymentStatus: "pending", // Default status for manual verification
      },
      { upsert: true }
    );

    // ✅ Mark onboarding complete
    await Company.findByIdAndUpdate(companyId, {
      onboardingCompleted: true,
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("Onboarding error:", err);
    return res.status(500).json({ ok: false, error: "Failed to save onboarding" });
  }
}
