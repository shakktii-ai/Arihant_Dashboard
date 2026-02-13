// import dbConnect from "../../../../lib/db";
// import CompanyPayment from "../../../../models/CompanyPayment";
// import { verifyTokenFromReq } from "../../../../lib/verifyToken";

// export default async function handler(req, res) {
//   await dbConnect();

//   if (req.method === "GET") {
//     try {
//       const token = verifyTokenFromReq(req);
//       if (!token)
//         return res.status(401).json({ ok: false, error: "Unauthorized" });

//       const payment = await CompanyPayment
//         .findOne({ companyId: token.companyId })
//         .lean();

//       return res.status(200).json({ ok: true, payment });

//     } catch (err) {
//       return res.status(500).json({
//         ok: false,
//         error: "Failed to fetch payment info",
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
//     if (!token)
//       return res.status(401).json({ ok: false, error: "Unauthorized" });

//     const { paymentProof } = req.body;

//     if (!paymentProof) {
//       return res.status(400).json({
//         ok: false,
//         error: "Payment proof required",
//       });
//     }

//     // Save or update payment
//     await CompanyPayment.findOneAndUpdate(
//       { companyId: token.companyId },
//       {
//         companyId: token.companyId,
//         paymentProof,
//         amount: 1475,
//         creditsRemaining: 5,
//         paymentStatus: "pending",
//       },
//       { upsert: true }
//     );

//     return res.status(200).json({
//       ok: true,
//       message: "Payment submitted successfully. Waiting for admin approval.",
//     });

//   } catch (err) {
//     console.error("Payment error:", err);
//     return res.status(500).json({
//       ok: false,
//       error: "Failed to save payment",
//     });
//   }
// }


// pages/api/admin/company/payment/index.js

import dbConnect from "../../../../lib/db";
import CompanyPayment from "../../../../models/CompanyPayment";
import CompanyOnboarding from "../../../../models/CompanyOnboarding";
import Invoice from "../../../../models/Invoice";
import { generateInvoiceNumber } from "../../../../lib/GenerateInvoiceNumber";
import { verifyTokenFromReq } from "../../../../lib/verifyToken";

export default async function handler(req, res) {
  await dbConnect();

  const token = verifyTokenFromReq(req);
  if (!token)
    return res.status(401).json({ ok: false, error: "Unauthorized" });

  const companyId = token.companyId;

  // ============================================================
  // GET — Fetch Latest Payment Info
  // ============================================================
  if (req.method === "GET") {
    try {
      const payment = await CompanyPayment
        .findOne({ companyId })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({ ok: true, payment });

    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch payment info",
      });
    }
  }

  // ============================================================
  // POST — Auto Approve Payment + Generate Invoice
  // ============================================================
  if (req.method === "POST") {
    try {
      const { paymentProof, creditsToAdd = 5 } = req.body;

      if (!paymentProof) {
        return res.status(400).json({
          ok: false,
          error: "Payment proof required",
        });
      }

      const pricePerCredit = 250;
      const subTotal = creditsToAdd * pricePerCredit;
      const gstRate = 18;
      const gstAmount = (subTotal * gstRate) / 100;
      const grandTotal = subTotal + gstAmount;

      // =====================================================
      // 1️⃣ CREATE PAYMENT RECORD (Auto Approved)
      // =====================================================
      const payment = await CompanyPayment.create({
        companyId,
        paymentProof,
        amount: grandTotal,
        creditsRemaining: creditsToAdd,
        paymentStatus: "approved",
      });

      // =====================================================
      // 2️⃣ GENERATE INVOICE
      // =====================================================
      const onboarding = await CompanyOnboarding.findOne({ companyId });

      await Invoice.create({
        invoiceNumber: await generateInvoiceNumber(),
        companyId,
        companyName: onboarding?.companyName || "",
        gstNumber: onboarding?.gstNumber || "",
        billingAddress: onboarding?.registeredAddress || "",

        items: [
          {
            description: `Credit Purchase (${creditsToAdd} credits)`,
            quantity: creditsToAdd,
            unitPrice: pricePerCredit,
            total: subTotal,
          },
        ],

        subTotal,
        gstRate,
        gstAmount,
        grandTotal,
        paymentStatus: "paid",
      });

      return res.status(200).json({
        ok: true,
        message: "Payment successful. Credits added & invoice generated.",
        creditsRemaining: creditsToAdd,
      });

    } catch (err) {
      console.error("Payment error:", err);
      return res.status(500).json({
        ok: false,
        error: "Failed to process payment",
      });
    }
  }

  return res.status(405).json({
    ok: false,
    error: "Method not allowed",
  });
}
