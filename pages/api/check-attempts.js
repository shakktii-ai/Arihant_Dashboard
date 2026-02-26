// pages/api/check-attempts.js
import dbConnect from "../../lib/db";
import InterviewSession from "../../models/InterviewSession";
import JobInfo from "../../models/JobInfo";

export default async function handler(req, res) {
    await dbConnect();

    if (req.method !== "POST") {
        return res.status(405).json({ ok: false, detail: "Only POST allowed" });
    }

    const { email, slug } = req.body;

    if (!email || !slug) {
        return res.status(400).json({ ok: false, detail: "Missing email or slug" });
    }

    try {
        // Find the job by slug
        const job = await JobInfo.findOne({ slug });
        if (!job) {
            return res.status(404).json({ ok: false, detail: "Job not found" });
        }

        // Count existing attempts
        const attemptCount = await InterviewSession.countDocuments({
            "candidate.email": email,
            jobInfo: job._id,
        });

        const MAX_ATTEMPTS = 1;
        const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attemptCount);

        return res.status(200).json({
            ok: true,
            attemptCount,
            remainingAttempts,
            maxAttempts: MAX_ATTEMPTS,
            canAttempt: attemptCount < MAX_ATTEMPTS,
        });
    } catch (err) {
        console.error("Check attempts error:", err);
        return res.status(500).json({
            ok: false,
            detail: err.message || "Internal server error",
        });
    }
}
