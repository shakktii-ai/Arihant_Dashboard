import { useEffect, useState,useRef } from "react";
import { useRouter } from "next/router";

export default function GeneratingPage() {
  const router = useRouter();
  const { sessionId, slug } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const hasCalled = useRef(false);
  useEffect(() => {
  if (!router.isReady || !sessionId || hasCalled.current) return;

  hasCalled.current = true; // 🚫 prevents second call

  const generateReport = async () => {
    try {
      const res = await fetch("/api/admin/interviews/finish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to generate report");
      }

      router.push(`/interview/${slug}/thank-you`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  generateReport();
}, [router.isReady, sessionId]);
  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">

          {/* Spinner */}
          <div className="mb-6">
            <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>

          {/* Title */}
          <p className="text-lg font-semibold">
            Submitting Assessment...
          </p>

         
        </div>
      </div>
    );
  }

  /* ================= ERROR ================= */

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4 font-medium">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return null;
}