import dbConnect from "../../../../lib/db";
import Report from "../../../../models/Report";
import mongoose from "mongoose";
import { verifyTokenFromReq } from "../../../../lib/verifyToken";

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: "Invalid report ID" });
  }

  const user = verifyTokenFromReq(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const report = await Report.findById(id)
      .populate("companyId", "name")
      .lean();

    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }

    return res.status(200).json({
      success: true,
      report: {
        _id: report._id,
        companyName: report.companyId?.name || "Unknown",
        email: report.email,
        role: report.role,
        collegeName: report.collegeName || "",
        reportAnalysis: report.reportAnalysis,
        shortlisted: report.shortlisted,
        sessionId: report.sessionId,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    console.error("Fetch superadmin report error:", error);
    return res.status(500).json({ success: false, error: "Unable to load report" });
  }
}
