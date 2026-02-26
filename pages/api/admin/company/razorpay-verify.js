import crypto from "crypto";
import dbConnect from "../../../../lib/db";
import CompanyPayment from "../../../../models/CompanyPayment";
import CompanyOnboarding from "../../../../models/CompanyOnboarding";
import Invoice from "../../../../models/Invoice";
import { generateInvoiceNumber } from "../../../../lib/GenerateInvoiceNumber";
import { verifyTokenFromReq } from "../../../../lib/verifyToken";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    await dbConnect();

    const token = verifyTokenFromReq(req);
    if (!token) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ ok: false, error: "Missing payment details" });
    }

    try {
        // 1. Verify Payment Signature
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ ok: false, error: "Transaction not authentic" });
        }

        // 2. Update Payment Record
        const creditsToAdd = 5;
        const pricePerCredit = 250;
        const subTotal = creditsToAdd * pricePerCredit;
        const gstRate = 18;
        const gstAmount = (subTotal * gstRate) / 100;
        const grandTotal = subTotal + gstAmount;

        // Check if it's a test payment (by ID or by the Key being used)
        const isTestKey = (process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_test_");
        const isTestId = razorpay_payment_id.startsWith("pay_test_");
        const isTestMode = isTestKey || isTestId;

        const payment = await CompanyPayment.create({
            companyId: token.companyId,
            paymentProof: `RZP_PAYMENT_ID:${razorpay_payment_id}${isTestMode ? " (TEST)" : ""}`,
            amount: grandTotal,
            creditsRemaining: isTestMode ? 0 : creditsToAdd,
            paymentStatus: isTestMode ? "test_paid" : "approved",
        });

        // 3. Update Company Onboarding (Credits) - Only if NOT a test payment
        if (!isTestMode) {
            await CompanyOnboarding.findOneAndUpdate(
                { companyId: token.companyId },
                { $inc: { creditsRemaining: creditsToAdd } },
                { upsert: true }
            );
        }

        // 4. Generate Invoice
        const onboarding = await CompanyOnboarding.findOne({ companyId: token.companyId });

        await Invoice.create({
            invoiceNumber: await generateInvoiceNumber(),
            companyId: token.companyId,
            companyName: onboarding?.companyName || "",
            gstNumber: onboarding?.gstNumber || "",
            billingAddress: onboarding?.registeredAddress || "",
            items: [
                {
                    description: `Credit Purchase (${creditsToAdd} credits)${isTestMode ? " (TEST)" : ""}`,
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

        return res.status(200).json({ ok: true, message: "Payment verified successfully", creditsRemaining: creditsToAdd });

    } catch (err) {
        console.error("Razorpay verification error:", err);
        return res.status(500).json({ ok: false, error: "Verification failed", details: err.message });
    }
}
