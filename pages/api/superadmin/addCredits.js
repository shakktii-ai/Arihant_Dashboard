// import dbConnect from "../../../lib/db";
// import CompanyOnboarding from "../../../models/CompanyOnboarding";
// import { verifyTokenFromReq } from "../../../lib/verifyToken";

// export default async function handler(req, res) {
//   await dbConnect();

//   const user = verifyTokenFromReq(req);
//   if (!user) return res.status(401).json({ success: false });

//   if (req.method !== "POST") {
//     return res.status(405).json({ success: false });
//   }

//   const { companyId, amount } = req.body;

//   try {
//     await CompanyOnboarding.findOneAndUpdate(
//       { companyId },
//       { $inc: { creditsRemaining: amount } }
//     );

//     return res.status(200).json({ success: true });
//   } catch {
//     return res.status(500).json({ success: false });
//   }
// }
import dbConnect from "../../../lib/db";
import CompanyOnboarding from "../../../models/CompanyOnboarding";
import Payment from "../../../models/CompanyPayment";
import Invoice from "../../../models/Invoice";
import { generateInvoiceNumber } from "../../../lib/GenerateInvoiceNumber";
import { verifyTokenFromReq } from "../../../lib/verifyToken";

export default async function handler(req, res) {
  await dbConnect();

  const user = verifyTokenFromReq(req);
  if (!user) return res.status(401).json({ success: false });

  const { companyId, amount } = req.body;

  try {

    if (!companyId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid credit amount",
      });
    }

    const onboarding = await CompanyOnboarding.findOne({ companyId });
    if (!onboarding)
      return res.status(404).json({ success: false, message: "Company not found" });

    /* =====================================================
       CREDIT UPDATE LOGIC
    ===================================================== */

    // 🔹 Check if company already using Payment system
    let payment = await Payment.findOne({ companyId });

    let updatedCredits = 0;

    if (payment) {
      // ✅ NEW SYSTEM → Update Payment credits
      const updated = await Payment.findOneAndUpdate(
        { companyId },
        { $inc: { creditsRemaining: amount } },
        { new: true }
      );

      updatedCredits = updated.creditsRemaining;

    } else {
      // ✅ OLD SYSTEM → Update Onboarding credits
      const updated = await CompanyOnboarding.findOneAndUpdate(
        { companyId },
        { $inc: { creditsRemaining: amount } },
        { new: true }
      );

      updatedCredits = updated.creditsRemaining;
    }

    /* =====================================================
       INVOICE LOGIC
    ===================================================== */

    const pricePerCredit = 250; // configurable later
    const subTotal = amount * pricePerCredit;

    const gstRate = 18;
    const gstAmount = (subTotal * gstRate) / 100;

    const grandTotal = subTotal + gstAmount;

    await Invoice.create({
      invoiceNumber: await generateInvoiceNumber(),
      companyId,
      companyName: onboarding.companyName,
      gstNumber: onboarding.gstNumber,
      billingAddress: onboarding.registeredAddress,

      items: [
        {
          description: `Credit Purchase (${amount} credits)`,
          quantity: amount,
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
      success: true,
      message: "Credits added & invoice generated",
      creditsRemaining: updatedCredits,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false });
  }
}
