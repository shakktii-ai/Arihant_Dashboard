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
import { ShieldAlert, Wifi, Timer, RotateCcw, Send } from 'lucide-react';
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
 const instructions = [
   {
      title: "Complete All Stages in One Session",
      desc:
        "The aptitude test, technical test, and AI interview must be completed in the same session. You cannot pause and resume later.",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      color: "border-emerald-100 bg-emerald-50",
    },
    {
      title: "Assessment Duration: 60 Mins",
      desc:
        "Please ensure you are ready before starting the assessment. Only begin when you have enough time to complete the full assessment without interruption.",
      icon: <RotateCcw className="w-5 h-5 text-amber-600" />,
      color: "border-amber-100 bg-amber-50",
    },
    {
      title: "Do Not Leave the Assessment Window",
      desc:
        "Switching tabs, minimizing the browser, or navigating away may be treated as suspicious activity and can automatically terminate your assessment.",
      icon: <ShieldAlert className="w-5 h-5 text-red-600" />,
      color: "border-red-100 bg-red-50",
    },
    {
      title: "Stable Internet Connection Required",
      desc:
        "Please ensure you have a reliable internet connection and stable electricity supply before starting.",
      icon: <Wifi className="w-5 h-5 text-sky-600" />,
      color: "border-sky-100 bg-sky-50",
    },
   
    {
      title: "Assessment is Strictly Timed",
      desc:
        "Each section has a fixed duration. Once the timer ends, answers are automatically submitted and you cannot revisit the section.",
      icon: <Timer className="w-5 h-5 text-violet-600" />,
      color: "border-violet-100 bg-violet-50",
    },
    
    {
      title: "Camera & Microphone Access Required",
      desc:
        "For the interview round, your browser must have camera and microphone permission enabled before proceeding.",
      icon: <Video className="w-5 h-5 text-indigo-600" />,
      color: "border-indigo-100 bg-indigo-50",
    },
  ]; return (
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
              Please read the following guidelines carefully before starting your assessment.
            </p>
          </div>
          
{/* ================= GUIDELINES ================= */}
          <div className="max-w-4xl mx-auto p-4">
            

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instructions.map((item, index) => (
                <div
                  key={index}
                  className={`${item.color} border rounded-xl p-4 transition-all hover:shadow-md flex flex-col gap-3`}
                >
                  <div className="p-2 bg-white w-fit rounded-lg shadow-sm">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* ================= STAGES ================= */}
          <div className="mb-8">
            {/* <h2 className="text-xl font-semibold text-slate-800 mb-6">
              Assessment Stages
            </h2> */}

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
              ${agreedToTerms
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