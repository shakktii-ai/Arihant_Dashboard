import Razorpay from "razorpay";
import { verifyTokenFromReq } from "../../../../lib/verifyToken";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const token = verifyTokenFromReq(req);
    if (!token) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    try {
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        // Amount is 1475.00 INR (147500 paise)
        const options = {
            amount: 147500,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await instance.orders.create(options);

        if (!order) {
            return res.status(500).json({ ok: false, error: "Failed to create order" });
        }

        return res.status(200).json({
            ok: true,
            order: {
                ...order,
                key_id: process.env.RAZORPAY_KEY_ID
            }
        });
    } catch (err) {
        console.error("Razorpay order error:", err);
        return res.status(500).json({ ok: false, error: "Razorpay order error", details: err.message });
    }
}
