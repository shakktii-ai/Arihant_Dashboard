import dbConnect from "../../../lib/db";
import Invoice from "../../../models/Invoice";
import { verifyTokenFromReq } from "../../../lib/verifyToken";

export default async function handler(req, res) {
  await dbConnect();

  // 🔐 Verify superadmin
  const user = verifyTokenFromReq(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed",
    });
  }

  try {
    const invoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      invoices,
    });

  } catch (error) {
    console.error("Invoice Fetch Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
