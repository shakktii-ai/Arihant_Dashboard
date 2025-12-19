import { useState } from "react";
import { useRouter } from "next/router";

export default function InterviewInstructions() {
  const router = useRouter();
  const { slug, sessionId } = router.query;

  const [agreed, setAgreed] = useState(false);

  const handleStart = () => {
    if (!agreed) return;
    router.push(`/instructions/${sessionId}?slug=${slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-3xl w-full rounded-xl shadow-lg p-6">

        <h1 className="text-2xl font-semibold mb-4">
          Assessment Instructions & Rules
        </h1>

        {/* Overview */}
        <section className="mb-5">
          <h2 className="font-semibold text-gray-800 mb-2">Test Overview</h2>
          <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
            <li>This assessment evaluates aptitude, technical, and soft skills.</li>
            <li>The test must be completed in one sitting.</li>
            <li>Section order is fixed and cannot be skipped.</li>
          </ul>
        </section>

        {/* Timing */}
        <section className="mb-5">
          <h2 className="font-semibold text-gray-800 mb-2">Section Timing</h2>
          <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
            <li>Aptitude: 5 minutes</li>
            <li>Technical (Voice): 30 minutes</li>
            <li>Soft Skills (Voice): 30 minutes</li>
          </ul>
        </section>

        {/* Rules */}
        <section className="mb-5">
          <h2 className="font-semibold text-gray-800 mb-2">Important Rules</h2>
          <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
            <li>Tab switching, copying, or screen capture is not allowed.</li>
            <li>Page refresh may end the assessment.</li>
            <li>Multiple rule violations may lead to auto-submission.</li>
            <li>Ensure a stable internet connection and a working microphone.</li>
          </ul>
        </section>

        {/* Consent */}
        <div className="flex items-start gap-2 mb-6">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="agree" className="text-sm text-gray-700">
            I have read and understood the instructions and agree to follow all
            assessment rules.
          </label>
        </div>

        {/* Start */}
        <div className="flex justify-end">
          <button
            disabled={!agreed}
            onClick={handleStart}
            className={`px-6 py-2 rounded-lg font-medium text-white transition
              ${agreed
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-400 cursor-not-allowed"}`}
          >
            Start Assessment
          </button>
        </div>

      </div>
    </div>
  );
}
