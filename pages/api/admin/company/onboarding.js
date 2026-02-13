// import dbConnect from "../../../../lib/db";
// import CompanyOnboarding from "../../../../models/CompanyOnboarding";
// import Company from "../../../../models/company";
// import { verifyTokenFromReq } from "../../../../lib/verifyToken";

// export default async function handler(req, res) {
//   await dbConnect();

//   if (req.method === "GET") {
//     try {
//       const token = verifyTokenFromReq(req);
//       if (!token) return res.status(401).json({ ok: false, error: "Unauthorized" });

//       let onboarding = await CompanyOnboarding.findOne({ companyId: token.companyId }).lean();

//       // If onboarding exists but credits are missing/zero (for existing users), default to 5
//       if (onboarding && (onboarding.creditsRemaining === undefined || onboarding.creditsRemaining === null)) {
//         onboarding.creditsRemaining = 5;
//         await CompanyOnboarding.updateOne({ _id: onboarding._id }, { $set: { creditsRemaining: 5 } });
//       }

//       return res.status(200).json({ ok: true, onboarding });
//     } catch (err) {
//       return res.status(500).json({ ok: false, error: "Failed to fetch onboarding info" });
//     }
//   }

//   if (req.method !== "POST") {
//     return res.status(405).json({ ok: false, error: "Method not allowed" });
//   }

//   try {
//     const token = verifyTokenFromReq(req);
//     if (!token) {
//       return res.status(401).json({ ok: false, error: "Unauthorized" });
//     }

//     const companyId = token.companyId;
//     const body = req.body;

//     if (!companyId || !body.industry || !body.companyType) {
//       return res.status(400).json({ ok: false, error: "Missing required fields" });
//     }

//     // Save or update onboarding
//     await CompanyOnboarding.findOneAndUpdate(
//       { companyId },
//       {
//         companyId,
//         ...body,
//         sampleClients: body.sampleClients
//           ? body.sampleClients.split(",").map((c) => c.trim())
//           : [],
//         creditsRemaining: 5, // Initialize with 5 credits as requested
//         paymentStatus: "pending", // Default status for manual verification
//       },
//       { upsert: true }
//     );

//     // ✅ Mark onboarding complete
//     await Company.findByIdAndUpdate(companyId, {
//       onboardingCompleted: true,
//     });

//     return res.status(200).json({ ok: true });

//   } catch (err) {
//     console.error("Onboarding error:", err);
//     return res.status(500).json({ ok: false, error: "Failed to save onboarding" });
//   }
// }


// import dbConnect from "../../../../lib/db";
// import CompanyOnboarding from "../../../../models/CompanyOnboarding";
// import Company from "../../../../models/company";
// import { verifyTokenFromReq } from "../../../../lib/verifyToken";

// export default async function handler(req, res) {
//   await dbConnect();

//   if (req.method === "GET") {
//     try {
//       const token = verifyTokenFromReq(req);
//       if (!token)
//         return res.status(401).json({ ok: false, error: "Unauthorized" });

//       const onboarding = await CompanyOnboarding
//         .findOne({ companyId: token.companyId })
//         .lean();

//       return res.status(200).json({ ok: true, onboarding });
//     } catch (err) {
//       return res.status(500).json({
//         ok: false,
//         error: "Failed to fetch onboarding info",
//       });
//     }
//   }

//   if (req.method !== "POST") {
//     return res.status(405).json({
//       ok: false,
//       error: "Method not allowed",
//     });
//   }

//   try {
//     const token = verifyTokenFromReq(req);
//     if (!token) {
//       return res.status(401).json({ ok: false, error: "Unauthorized" });
//     }

//     const companyId = token.companyId;
//     const body = req.body;

//     if (!companyId || !body.industry || !body.companyType) {
//       return res.status(400).json({
//         ok: false,
//         error: "Missing required fields",
//       });
//     }

//     // ✅ Save onboarding only (NO payment data here)
//     await CompanyOnboarding.findOneAndUpdate(
//       { companyId },
//       {
//         companyId,
//         ...body,
//         sampleClients: body.sampleClients
//           ? body.sampleClients.split(",").map((c) => c.trim())
//           : [],
//       },
//       { upsert: true }
//     );

//     // Mark onboarding complete
//     await Company.findByIdAndUpdate(companyId, {
//       onboardingCompleted: true,
//     });

//     return res.status(200).json({ ok: true });

//   } catch (err) {
//     console.error("Onboarding error:", err);
//     return res.status(500).json({
//       ok: false,
//       error: "Failed to save onboarding",
//     });
//   }
// }



import dbConnect from "../../../../lib/db";
import CompanyOnboarding from "../../../../models/CompanyOnboarding";
import Company from "../../../../models/company";
import { verifyTokenFromReq } from "../../../../lib/verifyToken";

export default async function handler(req, res) {
  await dbConnect();

  /* ================= GET ================= */
  if (req.method === "GET") {
    try {
      const token = verifyTokenFromReq(req);
      if (!token)
        return res.status(401).json({ ok: false, error: "Unauthorized" });

      const companyId = token.companyId;

      let onboarding = await CompanyOnboarding
        .findOne({ companyId })
        .lean();

      // ✅ If logo missing → set default logo
      if (onboarding && !onboarding.companyLogo) {
        onboarding.companyLogo = "/arihant-logo.png";

        await CompanyOnboarding.updateOne(
          { _id: onboarding._id },
          { $set: { companyLogo: "/arihant-logo.png" } }
        );
      }

      return res.status(200).json({ ok: true, onboarding });

    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch onboarding info",
      });
    }
  }

  /* ================= METHOD CHECK ================= */
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  /* ================= POST ================= */
  try {
    const token = verifyTokenFromReq(req);
    if (!token) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const companyId = token.companyId;
    const body = req.body;

    if (!companyId || !body.industry || !body.companyType) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields",
      });
    }

    // ✅ Fetch existing onboarding (to protect logo from overwrite)
    const existing = await CompanyOnboarding
      .findOne({ companyId })
      .lean();

    const mergedData = {
      ...(existing || {}),
      companyId,
    };

    // ✅ Only overwrite if value is not empty
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== null && value !== "") {
        mergedData[key] = value;
      }
    }

    // Special handling for sampleClients
    if (body.sampleClients !== undefined && body.sampleClients !== "") {
      mergedData.sampleClients = body.sampleClients
        ? body.sampleClients.split(",").map((c) => c.trim())
        : [];
    }

    // ❗ Important: prevent _id overwrite
    delete mergedData._id;

    await CompanyOnboarding.findOneAndUpdate(
      { companyId },
      { $set: mergedData },
      { upsert: true, new: true, runValidators: true }
    );

    // Mark onboarding complete
    await Company.findByIdAndUpdate(companyId, {
      onboardingCompleted: true,
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("Onboarding error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to save onboarding",
    });
  }
}

/* ================= BODY SIZE ================= */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // Needed for base64 logo upload
    },
  },
};
