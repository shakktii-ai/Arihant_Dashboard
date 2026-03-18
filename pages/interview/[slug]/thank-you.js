import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

export default function ThankYou() {
  const router = useRouter();
  const { slug } = router.query;

  const [countdown, setCountdown] = useState(5);

  const handleContinue = useCallback(() => {
    const safeSlug =
      slug || localStorage.getItem("currentJobSlug");

    if (!safeSlug) return;

    router.push(`/mockInterview/role/${safeSlug}`);
  }, [slug, router]);

  useEffect(() => {
    if (!router.isReady) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleContinue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleContinue, router.isReady]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6">

        {/* SUCCESS ICON */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
        </div>

        {/* HEADING */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-semibold text-slate-800 mb-3">
            Stage 1 Completed
          </h1>
          <p className="text-slate-600">
            You have successfully completed the{" "}
            <span className="font-semibold">Assessment</span>.
          </p>
        </div>

        {/* PROGRESS FLOW */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-2 text-emerald-600 font-medium">
            <span>Assessment</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>

          <ArrowRight className="w-5 h-5 text-slate-400" />

          <div className="text-blue-600 font-medium">
            Interview (Next)
          </div>
        </div>

        {/* STAGE 2 CARD */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 text-center">
            Stage 2: AI Interview
          </h2>

        

          <div className="flex items-center justify-center gap-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">
              Preparing your interview...
            </span>
          </div>
        </div>

        {/* COUNTDOWN */}
        <div className="text-center mb-6">
          <p className="text-slate-500 text-sm">
            Redirecting in{" "}
            <span className="font-semibold text-slate-700">
              {countdown}s
            </span>
          </p>
        </div>

        {/* BUTTON */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Continue to Interview
          </button>
        </div>

      </div>
    </div>
  );
}