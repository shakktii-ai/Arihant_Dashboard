import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

function Report() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [jobRoleId, setJobRoleId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ================= GET JOB ROLE ID (FLOW B) ================= */
  useEffect(() => {
    const id = localStorage.getItem("_idForReport");

    if (!id) {
      setError("Interview session not found");
      setLoading(false);
      return;
    }

    setJobRoleId(id);
  }, []);

  /* ================= EXTRACT SCORE ================= */
  const extractOverallScore = (reportAnalysis) => {
    if (!reportAnalysis) return 0;

    const match = reportAnalysis.match(/overall.*?(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  };

  /* ================= STORE SCORE (FLOW B SAFE) ================= */
  const storeScore = async (role, email, overallScore) => {
    try {
      await fetch("/api/admin/mock/overallScore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          email,
          overallScore, // ✅ no collageName
        }),
      });
    } catch (err) {
      console.error("Score store error:", err);
    }
  };

  /* ================= STORE REPORT ================= */
  const storeReport = async (role, email, reportAnalysis) => {
    try {
      await fetch("/api/admin/mock/saveAndGetReport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          email,
          reportAnalysis, // ✅ no collageName
        }),
      });
    } catch (err) {
      console.error("Report store error:", err);
    }
  };

  /* ================= MAIN FLOW ================= */
  useEffect(() => {
    if (!jobRoleId) return;

    const generateReport = async () => {
      try {
        // 1️⃣ Fetch interview Q&A
        const res = await fetch(
          `/api/admin/mock/getReadyQuestionsAndAnswers?jobRoleId=${jobRoleId}`
        );

        if (!res.ok) throw new Error("Failed to fetch interview data");

        const data = await res.json();

        const { role, email } = data.data;
        setJobRole(role);
        setEmail(email);

        // 2️⃣ Generate AI report
        const reportRes = await fetch(
          "/api/admin/mock/reportFromModel",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: data.data }),
          }
        );

        if (!reportRes.ok) throw new Error("AI report generation failed");

        const reportJson = await reportRes.json();
        const reportText = reportJson.report || "";

        // 3️⃣ Extract score
        const overallScore = extractOverallScore(reportText);

        // 4️⃣ Store results
        await storeScore(role, email, overallScore);
        await storeReport(role, email, reportText);

        localStorage.removeItem("_idForReport");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    generateReport();
  }, [jobRoleId]);

  /* ================= UI ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Generating report...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-gray-900 text-white p-8">
              <h1 className="text-4xl font-bold mb-4">Thank You!</h1>

        <p className="text-lg text-gray-200 mb-6">
          Your interview has been submitted successfully.
        </p>

    </div>
  );
}

export default Report;
