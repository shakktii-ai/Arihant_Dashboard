import dbConnect from "../../../lib/db";
import Report from "../../../models/Report";
import Company from "../../../models/company";
import { verifyTokenFromReq } from "../../../lib/verifyToken";

export default async function handler(req, res) {
  await dbConnect();

  const user = verifyTokenFromReq(req);

  if (!user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const reports = await Report.find()
      .populate("companyId", "name")
      .sort({ createdAt: -1 });

    const formattedReports = reports.map((report) => ({
      _id: report._id,
      role: report.role,
      email: report.email,
      collegeName: report.collegeName || "",
      companyId: report.companyId?._id || null,
      companyName: report.companyId?.name || "Unknown",
      sessionId: report.sessionId,
      createdAt: report.createdAt,
       reportAnalysis:
    typeof report.reportAnalysis === "string"
      ? JSON.parse(report.reportAnalysis)
      : report.reportAnalysis || null,
    }));

    return res.status(200).json({ success: true, reports: formattedReports });
  } catch (error) {
    console.error("Superadmin fetch reports error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch reports" });
  }
}
