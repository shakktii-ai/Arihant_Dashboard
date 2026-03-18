import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileText,
  Video,
  Brain,
} from "lucide-react";
import { IoIosArrowBack } from "react-icons/io";

export default function RulesPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("candidateForm");
    if (!stored) {
      router.push(`/interview/${slug}/apply`);
      return;
    }
    setCandidate(JSON.parse(stored));
  }, [slug]);

  async function startInterview() {
    if (!agreedToTerms) {
      alert("Please confirm instructions before starting.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/admin/interviews/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, candidate }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.ok) {
      localStorage.setItem("candidateEmail", candidate.email);
      localStorage.removeItem("candidateForm");
      router.push(data.instructionsUrl);
    } else {
      alert(data.detail || "Unable to start interview");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <button
      onClick={() => router.back()}
      className="absolute top-6 left-6 text-gray-400 text-2xl transition"
    >
      <IoIosArrowBack />
    </button>
      <div className="max-w-4xl mx-auto">

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">

          {/* HEADER */}
          <div className="text-center mb-10">
           

            <h1 className="text-3xl font-semibold text-slate-800 mb-3">
              Assessment Instructions
            </h1>

            <p className="text-slate-600">
              Please review the following guidelines carefully before starting your assessment.
            </p>
          </div>

          {/* ================= STAGES ================= */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">
              Assessment Stages
            </h2>

            {/* ===== STAGE 1 ===== */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-700">
                  Stage 1: Assessment
                </h3>
              
              </div>

              <div className="grid md:grid-cols-2 gap-4">

                {/* Aptitude */}
                <div className="border rounded-xl p-5 hover:border-teal-300 hover:shadow-md transition">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Aptitude Test</h4>
                      <p className="text-sm text-slate-600">Multiple Choice Questions (MCQ)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-teal-600 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    Duration: 5 minutes
                  </div>
                </div>

                {/* Technical */}
                <div className="border rounded-xl p-5 hover:border-teal-300 hover:shadow-md transition">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Technical Test</h4>
                      <p className="text-sm text-slate-600">MCQ + Written Questions</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-teal-600 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    Duration: 30 minutes
                  </div>
                </div>
              </div>
            </div>

            {/* ===== STAGE 2 ===== */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-700">
                  Stage 2: Interview
                </h3>
               
              </div>

              <div className="border rounded-xl p-5 hover:border-teal-300 hover:shadow-md transition">
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">AI-Based Interview</h4>
                    <p className="text-sm text-slate-600">
                      Answer 11 structured interview questions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-teal-600 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Duration: ~15–20 minutes
                </div>
              </div>
            </div>
          </div>

          {/* ================= GUIDELINES ================= */}
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-6 mb-8">
            <div className="flex gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-teal-600 mt-1" />
              <h3 className="font-semibold text-slate-800">Important Guidelines</h3>
            </div>

            <ul className="space-y-4 text-sm text-slate-700">
              <li>• Both stages (Assessment and Interview) are mandatory.</li>
              <li>• Do not switch tabs or leave the screen during the test.</li>
              <li>• Ensure stable internet and quiet environment.</li>
              <li>• Each section is time-limited and auto-submits.</li>
              <li>• Refreshing/closing may lead to submission.</li>
              <li>• Entire test auto-submits after completion.</li>
            </ul>
          </div>

          {/* ================= CHECKBOX ================= */}
          <div className="mb-8">
            <label className="flex gap-3 p-4 border rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-slate-700">
                I have read and understood all instructions.
              </span>
            </label>
          </div>

          {/* ================= BUTTON ================= */}
          <div className="flex justify-end">
            <button
              onClick={startInterview}
              disabled={!agreedToTerms || loading}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition
              ${
                agreedToTerms
                  ? "bg-teal-600 text-white hover:bg-teal-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? "Starting..." : "Start Assessment"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        
      

      </div>
    </div>
  );
}