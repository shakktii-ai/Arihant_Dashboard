import { useEffect, useState } from "react";
import { useRouter } from "next/router";

function renderReportContent(reportAnalysis) {
  if (!reportAnalysis) {
    return <p className="text-gray-600">No report content available.</p>;
  }

  if (typeof reportAnalysis === "string") {
    return (
      <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 bg-gray-100 p-4 rounded-lg">
        {reportAnalysis}
      </pre>
    );
  }

  return (
    <div className="space-y-6 text-gray-800">
      {reportAnalysis.recommendation && (
        <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h2 className="text-lg font-semibold mb-2">Recommendation</h2>
          <pre className="whitespace-pre-wrap break-words text-sm">{JSON.stringify(reportAnalysis.recommendation, null, 2)}</pre>
        </section>
      )}
      {reportAnalysis.scores && (
        <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h2 className="text-lg font-semibold mb-2">Scores</h2>
          <pre className="whitespace-pre-wrap break-words text-sm">{JSON.stringify(reportAnalysis.scores, null, 2)}</pre>
        </section>
      )}
      {reportAnalysis.evaluationText && (
        <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h2 className="text-lg font-semibold mb-2">Evaluation Text</h2>
          <pre className="whitespace-pre-wrap break-words text-sm">{JSON.stringify(reportAnalysis.evaluationText, null, 2)}</pre>
        </section>
      )}
      {!reportAnalysis.recommendation && !reportAnalysis.scores && !reportAnalysis.evaluationText && (
        <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 bg-gray-100 p-4 rounded-lg">
          {JSON.stringify(reportAnalysis, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function SuperAdminReportDetail() {
  const router = useRouter();
  const { reportId } = router.query;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reportId) return;

    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/superadmin/report/${reportId}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "Unable to load report.");
          setLoading(false);
          return;
        }

        setReport(data.report);
      } catch (err) {
        console.error("Fetch report error:", err);
        setError("Unable to load report. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg font-semibold text-gray-700">Loading report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-xl text-center">
          <h1 className="text-2xl font-bold mb-4">Unable to load report</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/superadmin/reports")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Report Detail</h1>
            <p className="text-sm text-gray-600 mt-1">Full report view for superadmin review.</p>
          </div>
          <button
            onClick={() => router.push("/superadmin/reports")}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black"
          >
            ← Back to Reports
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Company</p>
            <p className="mt-2 text-gray-900 font-semibold">{report.companyName}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
            <p className="mt-2 text-gray-900 font-semibold">{report.email}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Role</p>
            <p className="mt-2 text-gray-900 font-semibold">{report.role}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Date</p>
            <p className="mt-2 text-gray-900 font-semibold">
              {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Full Report</h2>
          {renderReportContent(report.reportAnalysis)}
        </div>
      </div>
    </div>
  );
}
