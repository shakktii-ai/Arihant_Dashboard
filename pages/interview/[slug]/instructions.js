// // File: pages/instructions/[sessionId].jsx
// import { useRouter } from "next/router";
// import { useEffect, useMemo, useState } from "react";
// import { Mic, CheckCircle, Clock, FileText } from "lucide-react";
// import VoiceQuestion from "../../../components/VoiceQuestion";

// export default function InstructionsPage() {
//   const router = useRouter();
//   const { sessionId, slug } = router.query;

//   /* ================= STATE ================= */
//   const [session, setSession] = useState(null);
//   const [activeTab, setActiveTab] = useState("aptitude");

//   const [aptiAnswers, setAptiAnswers] = useState({});
//   const [aptiCompleted, setAptiCompleted] = useState(false);
//   const [techCompleted, setTechCompleted] = useState(false);
//   const [softCompleted, setSoftCompleted] = useState(false);

//   // store keys like "technical_0"
//   const [completedVoice, setCompletedVoice] = useState(new Set());

//   /* ================= TIMERS ================= */
//   const SECTION_TIMERS = useMemo(
//     () => ({
//       aptitude: 300,
//       technical: 1800,
//       softskill: 1800,
//     }),
//     []
//   );

//   const [timeLeft, setTimeLeft] = useState(SECTION_TIMERS[activeTab]);

//   /* ================= DERIVED ================= */
//   const aptiArray = session?.generatedQuestions?.aptitude || [];
//   const technicalArray = session?.generatedQuestions?.technical || [];
//   const softArray = session?.generatedQuestions?.softskill || [];

//   const questionsReady =
//     aptiArray.length > 0 &&
//     technicalArray.length > 0 &&
//     softArray.length > 0;

//   /* ================= POLLING ================= */
//   useEffect(() => {
//     if (!sessionId) return;

//     let interval;

//     const fetchSession = async () => {
//       try {
//         const res = await fetch(`/api/session/${sessionId}`);
//         const data = await res.json();

//         if (data.ok && data.session) {
//           setSession(data.session);

//           if (
//             data.session.questionStatus === "done" ||
//             data.session.questionStatus === "failed"
//           ) {
//             clearInterval(interval);
//           }
//         }
//       } catch (err) {
//         console.error("Session fetch error:", err);
//       }
//     };

//     fetchSession();
//     interval = setInterval(fetchSession, 3000);

//     return () => clearInterval(interval);
//   }, [sessionId]);

//   /* ================= TIMER ================= */
//   useEffect(() => {
//     setTimeLeft(SECTION_TIMERS[activeTab]);
//   }, [activeTab, SECTION_TIMERS]);

//   useEffect(() => {
//     if (!questionsReady) return;
//     if (timeLeft <= 0) return;

//     const t = setInterval(() => {
//       setTimeLeft((s) => s - 1);
//     }, 1000);

//     return () => clearInterval(t);
//   }, [timeLeft, questionsReady]);

//   /* ================= HELPERS ================= */
//   const formatTime = (s) => {
//     const m = Math.floor(s / 60);
//     const sec = s % 60;
//     return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
//   };

//   const canSwitchTo = (tab) => {
//     if (tab === "technical" && !aptiCompleted) return false;
//     if (tab === "softskill" && !techCompleted) return false;
//     return true;
//   };

//   /* ================= APTITUDE SUBMIT ================= */
//   async function submitMCQ() {
//     const answers = Object.entries(aptiAnswers).map(([k, v]) => ({
//       questionIndex: Number(k),
//       selectedOptionIndex: v,
//     }));

//     try {
//       const res = await fetch("/api/admin/interviews/submit-mcq", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ sessionId, answers }),
//       });

//       const j = await res.json();
//       if (j.ok) {
//         setAptiCompleted(true);
//         setActiveTab("technical");
//       } else {
//         alert("Aptitude submission failed");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Aptitude submit error");
//     }
//   }

//   /* ================= VOICE COMPLETE ================= */
//   function handleVoiceSubmitSuccess(section, index) {
//     setCompletedVoice((prev) => {
//       const next = new Set(prev);
//       next.add(`${section}_${index}`);
//       return next;
//     });
//   }

//   /* ================= SUBMIT TECHNICAL EARLY ================= */
//   function submitTechnicalEarly() {
//     const total = technicalArray.length;
//     const answered = Array.from(completedVoice).filter((k) =>
//       k.startsWith("technical_")
//     ).length;

//     if (answered < total) {
//       const ok = confirm(
//         `You answered ${answered}/${total} technical questions. Submit and move to Soft Skills?`
//       );
//       if (!ok) return;
//     }

//     setTechCompleted(true);
//     setActiveTab("softskill");
//   }

//   /* ================= FINISH INTERVIEW ================= */
//   async function finishInterview() {
//     try {
//       const res = await fetch("/api/admin/interviews/finish", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ sessionId }),
//       });
//       const j = await res.json();

//       if (j.ok) {
//         router.push(`/interview/${slug}/thank-you`);
//       } else {
//         alert("Finish failed");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Finish error");
//     }
//   }

//   /* ================= LOADERS ================= */
//   if (!session) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <p>Loading interview session…</p>
//       </div>
//     );
//   }

//   if (
//     session.questionStatus === "pending" ||
//     session.questionStatus === "generating"
//   ) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <p>Preparing your interview questions…</p>
//       </div>
//     );
//   }

//   if (session.questionStatus === "failed") {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-red-600">
//         Failed to generate interview questions.
//       </div>
//     );
//   }

//   /* ================= UI ================= */
//   return (
//     <div className="min-h-screen bg-gray-50 p-6 max-w-6xl mx-auto">
//       <div className="flex justify-between mb-4">
//         <h1 className="text-xl font-semibold">Assessment Test</h1>
//         <span className="font-mono">{formatTime(timeLeft)}</span>
//       </div>

//       {/* APTITUDE */}
//       {activeTab === "aptitude" && (
//         <div>
//           {aptiArray.map((q, i) => (
//             <div key={i} className="mb-4 p-4 bg-white rounded shadow">
//               <p className="font-medium mb-2">
//                 {i + 1}. {q.prompt}
//               </p>
//               {q.options.map((o, oi) => (
//                 <label key={oi} className="block">
//                   <input
//                     type="radio"
//                     checked={aptiAnswers[i] === oi}
//                     onChange={() =>
//                       setAptiAnswers({ ...aptiAnswers, [i]: oi })
//                     }
//                   />{" "}
//                   {o}
//                 </label>
//               ))}
//             </div>
//           ))}
//           <button onClick={submitMCQ} className=" flex flex-center border border-black">
//             Submit Aptitude
//           </button>
//         </div>
//       )}

//       {/* TECHNICAL */}
//       {activeTab === "technical" && (
//         <div className="space-y-4">
//           {technicalArray.map((q, i) => (
//             <VoiceQuestion
//               key={i}
//               sessionId={sessionId}
//               section="technical"
//               questionIndex={i}
//               prompt={q.prompt}
//               onSubmitSuccess={handleVoiceSubmitSuccess}
//             />
//           ))}

//           <div className="flex justify-end">
//             <button
//               onClick={submitTechnicalEarly}
//               className="px-6 py-2 bg-black text-white rounded"
//             >
//               Submit Technical & Continue
//             </button>
//           </div>
//         </div>
//       )}

//       {/* SOFTSKILL */}
//       {activeTab === "softskill" && (
//         <div className="space-y-4">
//           {softArray.map((q, i) => (
//             <VoiceQuestion
//               key={i}
//               sessionId={sessionId}
//               section="softskill"
//               questionIndex={i}
//               prompt={q.prompt}
//               onSubmitSuccess={handleVoiceSubmitSuccess}
//             />
//           ))}

//           <button
//             onClick={finishInterview}
//             className="px-6 py-2 bg-green-600 text-white rounded"
//           >
//             Finish Interview
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }





// File: pages/instructions/[sessionId].jsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import VoiceQuestion from "../../../components/VoiceQuestion";

export default function InstructionsPage() {
  const router = useRouter();
  const { sessionId, slug } = router.query;

  /* ================= STATE ================= */
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("aptitude");

  const [aptiAnswers, setAptiAnswers] = useState({});
  const [aptiCompleted, setAptiCompleted] = useState(false);
  const [techCompleted, setTechCompleted] = useState(false);
  const [completedVoice, setCompletedVoice] = useState(new Set());

  /* ===== TAB SWITCH ===== */
  const [tabWarning, setTabWarning] = useState(false);
  const [tabViolations, setTabViolations] = useState(0);

  /* ================= BUTTON STYLE ================= */
  const primaryBtn =
    "px-6 py-2 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition";

  /* ================= TIMERS ================= */
  const SECTION_TIMERS = useMemo(
    () => ({
      aptitude: 300,
      technical: 1800,
      softskill: 1800,
    }),
    []
  );

  //  IMPORTANT: store start time PER SECTION
  const [sectionStartedAt, setSectionStartedAt] = useState({
    aptitude: null,
    technical: null,
    softskill: null,
  });

  const [timeLeft, setTimeLeft] = useState(SECTION_TIMERS[activeTab]);

  /* ================= DERIVED ================= */
  const aptiArray = session?.generatedQuestions?.aptitude || [];
  const technicalArray = session?.generatedQuestions?.technical || [];
  const softArray = session?.generatedQuestions?.softskill || [];

  const questionsReady =
    aptiArray.length > 0 &&
    technicalArray.length > 0 &&
    softArray.length > 0;


    useEffect(() => {
  if (timeLeft > 0) return;

  if (activeTab === "aptitude" && !aptiCompleted) {
    submitMCQ();
  }

  if (activeTab === "technical" && !techCompleted) {
    submitTechnicalEarly();
  }

  if (activeTab === "softskill") {
    finishInterview();
  }
}, [timeLeft]);


useEffect(() => {
  if (!sectionStartedAt[activeTab]) {
    setSectionStartedAt((prev) => ({
      ...prev,
      [activeTab]: Date.now(),
    }));
  }
}, [activeTab, sectionStartedAt]);



  /* ================= POLLING ================= */
  useEffect(() => {
    if (!sessionId) return;

    const fetchSession = async () => {
      const res = await fetch(`/api/session/${sessionId}`);
      const data = await res.json();
      if (data.ok) setSession(data.session);
    };

    fetchSession();
    const i = setInterval(fetchSession, 3000);
    return () => clearInterval(i);
  }, [sessionId]);

  /* ================= RESTORE STATE ================= */
  useEffect(() => {
    if (!sessionId) return;

    const saved = localStorage.getItem(`assessment_${sessionId}`);
    if (!saved) {
      setSectionStartedAt({
        aptitude: Date.now(),
        technical: null,
        softskill: null,
      });
      return;
    }

    const parsed = JSON.parse(saved);
    setAptiAnswers(parsed.aptiAnswers || {});
    setActiveTab(parsed.activeTab || "aptitude");
    setAptiCompleted(parsed.aptiCompleted || false);
    setTechCompleted(parsed.techCompleted || false);
    setCompletedVoice(new Set(parsed.completedVoice || []));
    setSectionStartedAt(parsed.sectionStartedAt);
  }, [sessionId]);

  /* ================= SAVE STATE ================= */
  useEffect(() => {
    if (!sessionId) return;

    localStorage.setItem(
      `assessment_${sessionId}`,
      JSON.stringify({
        aptiAnswers,
        activeTab,
        aptiCompleted,
        techCompleted,
        completedVoice: Array.from(completedVoice),
        sectionStartedAt,
      })
    );
  }, [aptiAnswers, activeTab, aptiCompleted, techCompleted, completedVoice, sectionStartedAt]);

  /* ================= TIMER ================= */
  useEffect(() => {
    const start = sectionStartedAt[activeTab];
    if (!start) return;

    const total = SECTION_TIMERS[activeTab];

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const left = total - elapsed;
      setTimeLeft(left > 0 ? left : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTab, sectionStartedAt, SECTION_TIMERS]);

  /* ================= ANTI-CHEAT (REAL FIX) ================= */
  useEffect(() => {
    const blockCopy = (e) => e.preventDefault();

    const blockKeys = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "v", "x", "a"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    };

    const visibility = () => {
      if (document.hidden) {
        setTabViolations((v) => v + 1);
        setTabWarning(true);
        setTimeout(() => setTabWarning(false), 8000);
      }
    };

    document.addEventListener("copy", blockCopy);
    document.addEventListener("cut", blockCopy);
    document.addEventListener("contextmenu", blockCopy);
    window.addEventListener("keydown", blockKeys);
    document.addEventListener("visibilitychange", visibility);

    return () => {
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("cut", blockCopy);
      document.removeEventListener("contextmenu", blockCopy);
      window.removeEventListener("keydown", blockKeys);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  /* ================= HELPERS ================= */
  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ================= SUBMITS ================= */
  async function submitMCQ() {
    await fetch("/api/admin/interviews/submit-mcq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        answers: Object.entries(aptiAnswers).map(([k, v]) => ({
          questionIndex: Number(k),
          selectedOptionIndex: v,
        })),
      }),
    });

    setAptiCompleted(true);
    setActiveTab("technical");
    setSectionStartedAt((s) => ({ ...s, technical: Date.now() }));
  }

  function handleVoiceSubmitSuccess(section, index) {
    setCompletedVoice((p) => new Set(p).add(`${section}_${index}`));
  }

  function submitTechnicalEarly() {
    setTechCompleted(true);
    setActiveTab("softskill");
    setSectionStartedAt((s) => ({ ...s, softskill: Date.now() }));
  }

  async function finishInterview() {
    localStorage.removeItem(`assessment_${sessionId}`);
    await fetch("/api/admin/interviews/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    router.push(`/interview/${slug}/thank-you`);
  }

  /* ================= UI ================= */
  if (!session)
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  if (!questionsReady)
    return <div className="min-h-screen flex items-center justify-center">Preparing questions…</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-6xl mx-auto select-none">
      <div className="flex justify-between mb-2">
        <h1 className="text-xl font-semibold">Assessment Test</h1>
        <span className="font-mono">{formatTime(timeLeft)}</span>
      </div>

      {tabWarning && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-900 text-sm">
          ⚠️ Tab switching is not allowed during the assessment.
        </div>
      )}

      {activeTab === "aptitude" && (
        <>
          {aptiArray.map((q, i) => (
            <div key={i} className="mb-4 p-4 bg-white rounded shadow">
              <p className="font-medium mb-2">{i + 1}. {q.prompt}</p>
              {q.options.map((o, oi) => (
                <label key={oi} className="block">
                  <input
                    type="radio"
                    checked={aptiAnswers[i] === oi}
                    onChange={() =>
                      setAptiAnswers({ ...aptiAnswers, [i]: oi })
                    }
                  />{" "}
                  {o}
                </label>
              ))}
            </div>
          ))}
          <button onClick={submitMCQ} className={primaryBtn}>Submit Aptitude</button>
        </>
      )}

      {activeTab === "technical" && (
        <>
          {technicalArray.map((q, i) => (
            <VoiceQuestion
              key={i}
              sessionId={sessionId}
              section="technical"
              questionIndex={i}
              prompt={q.prompt}
              onSubmitSuccess={handleVoiceSubmitSuccess}
            />
          ))}
          <button onClick={submitTechnicalEarly} className={primaryBtn}>
            Submit Technical & Continue
          </button>
        </>
      )}

      {activeTab === "softskill" && (
        <>
          {softArray.map((q, i) => (
            <VoiceQuestion
              key={i}
              sessionId={sessionId}
              section="softskill"
              questionIndex={i}
              prompt={q.prompt}
              onSubmitSuccess={handleVoiceSubmitSuccess}
            />
          ))}
          <button onClick={finishInterview} className={primaryBtn}>
            Finish Interview
          </button>
        </>
      )}
    </div>
  );
}



