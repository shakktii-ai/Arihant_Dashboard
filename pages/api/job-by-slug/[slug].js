// // pages/api/job-by-slug/[slug].js
// import dbConnect from "../../../lib/db";
// import JobInfo from "../../../models/JobInfo";

// export default async function handler(req, res) {
//   await dbConnect();
//   const { slug } = req.query;
//   const job = await JobInfo.findOne({ slug }).lean();
//   if (!job) return res.status(404).json({ ok: false, error: "Not found" });
//   res.status(200).json({ ok: true, job });
// }
// pages/api/job-by-slug/[slug].js
import dbConnect from "../../../lib/db";
import JobInfo from "../../../models/JobInfo";
import CompanyOnboarding from "../../../models/CompanyOnboarding"; // ✅ ADD THIS

export default async function handler(req, res) {
  await dbConnect();

  const { slug } = req.query;

  try {
    // 1️⃣ Find job
    const job = await JobInfo.findOne({ slug }).lean();

    if (!job) {
      return res.status(404).json({
        ok: false,
        error: "Job not found",
      });
    }

    // 2️⃣ Fetch company onboarding using companyId from job
    const onboarding = await CompanyOnboarding.findOne({
      companyId: job.companyId,
    }).lean();

    // 3️⃣ Attach logo safely
    const jobWithCompany = {
      ...job,
      companyLogo: onboarding?.companyLogo || "/MM_LOGO.png",
      companyName: onboarding?.companyName || "",
    };

    return res.status(200).json({
      ok: true,
      job: jobWithCompany,
    });

  } catch (err) {
    console.error("Job fetch error:", err);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}
