import crypto from "crypto";
import dbConnect from "../../../lib/db";
import CompanyPayment from "../../../models/CompanyPayment";
import CompanyOnboarding from "../../../models/CompanyOnboarding";
import Admin from "../../../models/admin";
import Invoice from "../../../models/Invoice";
import { generateInvoiceNumber } from "../../../lib/GenerateInvoiceNumber";

export const config = {
    api: {
        bodyParser: false,
    },
};

const getRawBody = async (readable) => {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    if (!secret) {
        console.error("RAZORPAY_WEBHOOK_SECRET is not defined in .env");
        return res.status(500).json({ message: "Webhook secret missing on server" });
    }

    try {
        const rawBody = await getRawBody(req);
        const bodyString = rawBody.toString();

        // 1. Verify Signature
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(bodyString)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.error("Invalid Webhook Signature");
            return res.status(400).json({ message: "Invalid signature" });
        }

        const data = JSON.parse(bodyString);
        console.log("-----------------------------------------");
        console.log("RAZORPAY WEBHOOK RECEIVED:", data.event);

        await dbConnect();

        // 2. Handle relevant events (Only completed payments)
        if (data.event === "payment.captured" || data.event === "invoice.paid") {
            let entity;
            if (data.event === "invoice.paid") {
                // For recurring mandate payments
                entity = data.payload.payment?.entity || data.payload.invoice?.entity;
            } else {
                // For one-time popup payments
                entity = data.payload.payment?.entity;
            }

            if (!entity) {
                console.error("No entity found in payload for event:", data.event);
                return res.status(200).json({ message: "No entity found" });
            }

            // --- Match by Email instead of manual Notes ---
            const customerEmail = entity.email || entity.customer_email || (data.payload.payment && data.payload.payment.entity.email);

            console.log(`[RAZORPAY WEBHOOK] Event: ${data.event} | Email: ${customerEmail}`);

            if (!customerEmail) {
                console.warn("No email found in Razorpay payload. Skipping automation.");
                return res.status(200).json({ message: "No email found" });
            }

            const admin = await Admin.findOne({ email: customerEmail.toLowerCase() });

            if (!admin) {
                console.warn(`No admin found for email: ${customerEmail}. Skipping automation.`);
                // Return 200 to Razorpay to acknowledge receipt, but log failure locally
                return res.status(200).json({
                    success: false,
                    message: `Admin not found for ${customerEmail}. Please check if this email exists in the Admin collection.`
                });
            }

            console.log("Found admin:", admin.name, "(Company ID:", admin.companyId, ")");

            const companyId = admin.companyId;
            const paymentId = entity.id;

            // check if payment already processed
            const existingPayment = await CompanyPayment.findOne({
                paymentProof: `RZP_PAYMENT_ID:${paymentId}`
            });

            if (existingPayment) {
                console.log("Payment already processed:", paymentId);
                return res.status(200).json({ message: "Payment already processed" });
            }

            console.log("Processing credits and invoice for company:", companyId);

            const isSubscription = data.event === "invoice.paid";
            const descriptionType = isSubscription ? "Subscription (UPI Mandate)" : "One-Time Payment";

            // Automation based on amount (assuming 1475 = 5 credits)
            const creditsToAdd = 5;
            const pricePerCredit = 250;
            const subTotal = 1250; // base price
            const gstRate = 18;
            const gstAmount = 225;
            const grandTotal = 1475;

            // --- TEST MODE DETECTION ---
            // 1. Check if ID starts with test prefix
            // 2. IMPORTANT: Check if the Server is using a TEST KEY
            const isTestKey = (process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_test_");
            const isTestId = paymentId.startsWith("pay_test_") || (entity.id && entity.id.startsWith("inv_test_"));

            const isTestMode = isTestKey || isTestId;

            if (isTestMode) {
                console.log(">>> TEST MODE DETECTED (Key or ID): Skipping credit update but generating invoice. <<<");
            }

            // 3. Update Records
            await CompanyPayment.create({
                companyId,
                paymentProof: `RZP_PAYMENT_ID:${paymentId}${isTestMode ? " (TEST)" : ""}`,
                amount: grandTotal,
                creditsRemaining: isTestMode ? 0 : creditsToAdd, // Don't add credits in test mode
                paymentStatus: isTestMode ? "test_paid" : "approved",
            });

            if (!isTestMode) {
                await CompanyOnboarding.findOneAndUpdate(
                    { companyId },
                    { $inc: { creditsRemaining: creditsToAdd } },
                    { upsert: true }
                );
            }

            const onboarding = await CompanyOnboarding.findOne({ companyId });

            await Invoice.create({
                invoiceNumber: await generateInvoiceNumber(),
                companyId,
                companyName: onboarding?.companyName || admin.name || "Company",
                gstNumber: onboarding?.gstNumber || "",
                billingAddress: onboarding?.registeredAddress || "",
                items: [
                    {
                        description: `${descriptionType} - ${creditsToAdd} Credits - Webhook${isTestMode ? " (TEST)" : ""}`,
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

            console.log(`Successfully processed payment for email: ${customerEmail} (Company: ${companyId})`);
        }

        return res.status(200).json({ status: "ok" });

    } catch (err) {
        console.error("Webhook Error:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
}
