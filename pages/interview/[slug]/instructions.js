// // pages/interview/[slug]/instructions.js
// import { useRouter } from "next/router";
// import { useEffect, useState } from "react";
// import VoiceQuestion from "../../../components/VoiceQuestion";

// export default function InstructionsPage() {
//   const router = useRouter();
//   const { sessionId, slug } = router.query;
//   const [session, setSession] = useState(null);
//   const [aptiAnswers, setAptiAnswers] = useState({});
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (!sessionId) return;
//     fetchSession();
//   }, [sessionId]);

//   async function fetchSession() {
//     try {
//       setLoading(true);
//       const r = await fetch(`/api/session/${sessionId}`);
//       const j = await r.json();
//       setLoading(false);
//       if (j.ok) setSession(j.session);
//       else alert("Failed to fetch session");
//     } catch (e) {
//       setLoading(false);
//       console.error(e);
//       alert("Error fetching session");
//     }
//   }

//   async function submitMCQ() {
//     const answers = Object.entries(aptiAnswers).map(([k, v]) => ({ questionIndex: Number(k), selectedOptionIndex: v }));
//     const res = await fetch("/api/admin/interviews/submit-mcq", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ sessionId, answers }),
//     });
//     const j = await res.json();
//     if (j.ok) {
//       alert("Aptitude answers submitted. Proceed to voice sections.");
//     } else {
//       alert("Submission failed");
//     }
//   }

//   if (loading || !session) return <div className="p-6">Loading...</div>;

//   // Map keys: the generator used earlier returned 'aptitude' / 'technical' / 'softskill' keys.
//   // Some earlier code used 'apti' - adapt if necessary.
//   const aptiArray = session.generatedQuestions.aptitude || session.generatedQuestions.apti || session.generatedQuestions.apti || [];
//   const technicalArray = session.generatedQuestions.technical || [];
//   const softArray = session.generatedQuestions.softskill || session.generatedQuestions.soft || [];

//   return (
//     <div className="p-6 max-w-4xl mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Interview Instructions</h1>
//       <div className="mb-4 p-3 bg-yellow-50 rounded">
//         <p className="mb-1">Please complete the aptitude MCQs first, then answer the technical and softskill questions using voice. Each voice answer should be concise (follow screen hints).</p>
//       </div>

//       <section className="mb-6">
//         <h2 className="font-semibold mb-3">Aptitude (MCQ)</h2>
//         {aptiArray.length === 0 && <div className="text-sm text-gray-500">No aptitude questions found.</div>}
//         {aptiArray.map((q, idx) => (
//           <div key={idx} className="border p-3 my-2 rounded">
//             <div className="font-medium">{idx + 1}. {q.prompt}</div>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
//               {(q.options || []).map((opt, oi) => (
//                 <label key={oi} className="border p-2 rounded cursor-pointer flex items-center gap-2">
//                   <input
//                     type="radio"
//                     name={`apti-${idx}`}
//                     onChange={() => setAptiAnswers({ ...aptiAnswers, [idx]: oi })}
//                     checked={aptiAnswers[idx] === oi}
//                   />
//                   <span>{opt}</span>
//                 </label>
//               ))}
//             </div>
//           </div>
//         ))}
//         {aptiArray.length > 0 && (
//           <div className="mt-3">
//             <button onClick={submitMCQ} className="px-4 py-2 bg-green-600 text-white rounded">Submit Aptitude Answers</button>
//           </div>
//         )}
//       </section>

//       <section className="mb-6">
//         <h2 className="font-semibold mb-3">Technical (Voice)</h2>
//         {technicalArray.length === 0 && <div className="text-sm text-gray-500">No technical questions found.</div>}
//         {technicalArray.map((q, idx) => (
//           <VoiceQuestion
//             key={`tech-${idx}`}
//             sessionId={sessionId}
//             section="technical"
//             questionIndex={idx}
//             prompt={q.prompt || q.question || q}
//           />
//         ))}
//       </section>

//       <section className="mb-6">
//         <h2 className="font-semibold mb-3">Softskill (Voice)</h2>
//         {softArray.length === 0 && <div className="text-sm text-gray-500">No softskill questions found.</div>}
//         {softArray.map((q, idx) => (
//           <VoiceQuestion
//             key={`soft-${idx}`}
//             sessionId={sessionId}
//             section="softskill"
//             questionIndex={idx}
//             prompt={q.prompt || q.question || q}
//           />
//         ))}
//       </section>

//       <div className="mt-6">
//         <button
//           onClick={() => alert("When you finish answering all sections, you'll be done. Admin can mark session complete.")}
//           className="px-4 py-2 bg-gray-800 text-white rounded"
//         >
//           Finish Interview
//         </button>
//       </div>
//     </div>
//   );
// }



// import { useRouter } from "next/router";
// import { useEffect, useState } from "react";
// import { Mic, CheckCircle, Clock, FileText } from "lucide-react";
// import VoiceQuestion from "../../components/VoiceQuestion";

// // VoiceQuestion Component (inline for demo)
// // function VoiceQuestion({ sessionId, section, questionIndex, prompt }) {
// //   const [recording, setRecording] = useState(false);
// //   const [submitted, setSubmitted] = useState(false);

// //   return (
// //     <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
// //       <div className="flex items-start gap-3">
// //         <div className="flex-shrink-0 mt-1">
// //           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
// //             submitted ? 'bg-green-100' : 'bg-blue-50'
// //           }`}>
// //             {submitted ? (
// //               <CheckCircle className="w-5 h-5 text-green-600" />
// //             ) : (
// //               <Mic className="w-5 h-5 text-blue-600" />
// //             )}
// //           </div>
// //         </div>
// //         <div className="flex-1">
// //           <p className="text-gray-800 font-medium mb-3">{prompt}</p>
// //           <div className="flex items-center gap-2">
// //             <button
// //               onClick={() => setRecording(!recording)}
// //               className={`px-4 py-2 rounded-lg font-medium transition-all ${
// //                 recording
// //                   ? 'bg-red-500 text-white hover:bg-red-600'
// //                   : 'bg-blue-600 text-white hover:bg-blue-700'
// //               }`}
// //             >
// //               {recording ? 'Stop Recording' : 'Start Recording'}
// //             </button>
// //             {!submitted && (
// //               <button
// //                 onClick={() => setSubmitted(true)}
// //                 className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all"
// //               >
// //                 Submit Answer
// //               </button>
// //             )}
// //             {submitted && (
// //               <span className="text-sm text-green-600 font-medium flex items-center gap-1">
// //                 <CheckCircle className="w-4 h-4" />
// //                 Submitted
// //               </span>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }



// export default function InstructionsPage() {
//   const router = useRouter();
//   const { sessionId, slug } = router.query;
//   const [session, setSession] = useState(null);
//   const [aptiAnswers, setAptiAnswers] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("aptitude");

//   useEffect(() => {
//     if (!sessionId) return;
//     fetchSession();
//   }, [sessionId]);

//   async function fetchSession() {
//     try {
//       setLoading(true);
//       const r = await fetch(`/api/session/${sessionId}`);
//       const j = await r.json();
//       setLoading(false);
//       if (j.ok) setSession(j.session);
//       else alert("Failed to fetch session");
//     } catch (e) {
//       setLoading(false);
//       console.error(e);
//       alert("Error fetching session");
//     }
//   }

//   async function submitMCQ() {
//     const answers = Object.entries(aptiAnswers).map(([k, v]) => ({ 
//       questionIndex: Number(k), 
//       selectedOptionIndex: v 
//     }));
//     const res = await fetch("/api/admin/interviews/submit-mcq", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ sessionId, answers }),
//     });
//     const j = await res.json();
//     if (j.ok) {
//       alert("Aptitude answers submitted. Proceed to voice sections.");
//       setActiveTab("technical");
//     } else {
//       alert("Submission failed");
//     }
//   }

//   if (loading || !session) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading interview...</p>
//         </div>
//       </div>
//     );
//   }

//   const aptiArray = session.generatedQuestions.aptitude || session.generatedQuestions.apti || [];
//   const technicalArray = session.generatedQuestions.technical || [];
//   const softArray = session.generatedQuestions.softskill || session.generatedQuestions.soft || [];

//   const tabs = [
//     { id: "aptitude", label: "Aptitude", icon: FileText, count: aptiArray.length },
//     { id: "technical", label: "Technical", icon: Mic, count: technicalArray.length },
//     { id: "softskill", label: "Soft Skills", icon: Mic, count: softArray.length },
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
//       <div className="max-w-6xl mx-auto p-6">
//         {/* Header */}
//         <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
//           <h1 className="text-3xl font-bold text-gray-800 mb-2">Interview Assessment</h1>
//           <p className="text-gray-600">Complete all sections to finish your interview</p>
//         </div>

//         {/* Instructions Banner */}
//         <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl shadow-lg p-6 mb-6">
//           <div className="flex items-start gap-3">
//             <Clock className="w-6 h-6 text-white flex-shrink-0 mt-1" />
//             <div className="text-white">
//               <h3 className="font-semibold text-lg mb-1">Important Instructions</h3>
//               <p className="text-white/90">
//                 1. Complete the aptitude MCQs first, then proceed to voice sections<br/>
//                 2. Each voice answer should be concise and clear<br/>
//                 3. Ensure good audio quality before recording
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
//           <div className="flex border-b border-gray-200 bg-gray-50">
//             {tabs.map((tab) => {
//               const Icon = tab.icon;
//               return (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`flex-1 px-6 py-4 font-semibold transition-all relative ${
//                     activeTab === tab.id
//                       ? 'text-blue-600 bg-white'
//                       : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
//                   }`}
//                 >
//                   <div className="flex items-center justify-center gap-2">
//                     <Icon className="w-5 h-5" />
//                     <span>{tab.label}</span>
//                     <span className={`px-2 py-0.5 rounded-full text-xs ${
//                       activeTab === tab.id 
//                         ? 'bg-blue-100 text-blue-700' 
//                         : 'bg-gray-200 text-gray-600'
//                     }`}>
//                       {tab.count}
//                     </span>
//                   </div>
//                   {activeTab === tab.id && (
//                     <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
//                   )}
//                 </button>
//               );
//             })}
//           </div>

//           {/* Tab Content */}
//           <div className="p-6">
//             {/* Aptitude Tab */}
//             {activeTab === "aptitude" && (
//               <div className="space-y-4">
//                 {aptiArray.length === 0 ? (
//                   <div className="text-center py-12 text-gray-500">
//                     No aptitude questions available
//                   </div>
//                 ) : (
//                   <>
//                     {aptiArray.map((q, idx) => (
//                       <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-sm">
//                         <div className="font-semibold text-gray-800 mb-4 text-lg">
//                           {idx + 1}. {q.prompt}
//                         </div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                           {(q.options || []).map((opt, oi) => (
//                             <label
//                               key={oi}
//                               className={`border-2 p-4 rounded-lg cursor-pointer transition-all ${
//                                 aptiAnswers[idx] === oi
//                                   ? 'border-blue-500 bg-blue-50 shadow-md'
//                                   : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
//                               }`}
//                             >
//                               <div className="flex items-center gap-3">
//                                 <input
//                                   type="radio"
//                                   name={`apti-${idx}`}
//                                   onChange={() => setAptiAnswers({ ...aptiAnswers, [idx]: oi })}
//                                   checked={aptiAnswers[idx] === oi}
//                                   className="w-4 h-4 text-blue-600"
//                                 />
//                                 <span className="text-gray-700 font-medium">{opt}</span>
//                               </div>
//                             </label>
//                           ))}
//                         </div>
//                       </div>
//                     ))}
//                     <div className="flex justify-end mt-6">
//                       <button
//                         onClick={submitMCQ}
//                         className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
//                       >
//                         Submit Aptitude Answers
//                       </button>
//                     </div>
//                   </>
//                 )}
//               </div>
//             )}

//             {/* Technical Tab */}
//             {activeTab === "technical" && (
//               <div className="space-y-4">
//                 {technicalArray.length === 0 ? (
//                   <div className="text-center py-12 text-gray-500">
//                     No technical questions available
//                   </div>
//                 ) : (
//                   technicalArray.map((q, idx) => (
//                     <VoiceQuestion
//                       key={`tech-${idx}`}
//                       sessionId={sessionId}
//                       section="technical"
//                       questionIndex={idx}
//                       prompt={q.prompt || q.question || q}
//                     />
//                   ))
//                 )}
//               </div>
//             )}

//             {/* Softskill Tab */}
//             {activeTab === "softskill" && (
//               <div className="space-y-4">
//                 {softArray.length === 0 ? (
//                   <div className="text-center py-12 text-gray-500">
//                     No soft skill questions available
//                   </div>
//                 ) : (
//                   softArray.map((q, idx) => (
//                     <VoiceQuestion
//                       key={`soft-${idx}`}
//                       sessionId={sessionId}
//                       section="softskill"
//                       questionIndex={idx}
//                       prompt={q.prompt || q.question || q}
//                     />
//                   ))
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Finish Button */}
//         <div className="mt-6 flex justify-center">
//           <button
//             onClick={() => alert("When you finish answering all sections, you'll be done. Admin can mark session complete.")}
//             className="px-8 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl font-semibold hover:from-gray-900 hover:to-black shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
//           >
//             Finish Interview
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


// File: pages/instructions/[sessionId].jsx
// "use client";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { Mic, CheckCircle, Clock, FileText } from "lucide-react";
import VoiceQuestion from "../../../components/VoiceQuestion";

export default function InstructionsPage() {
  const router = useRouter();
  const { sessionId, slug } = router.query;

  // session data
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  // aptitude answers local state (radio selections)
  const [aptiAnswers, setAptiAnswers] = useState({});

  // UI flow states
  const [activeTab, setActiveTab] = useState("aptitude");
  const [aptiCompleted, setAptiCompleted] = useState(false);
  const [techCompleted, setTechCompleted] = useState(false);
  const [softCompleted, setSoftCompleted] = useState(false);

  // Completed counters for voice sections: store keys like "technical_0"
  const [completedVoice, setCompletedVoice] = useState(() => new Set());

  // Timers (seconds) per section — adjust as needed
  const SECTION_TIMERS = useMemo(() => ({
    aptitude: 300, // 5 min
    technical: 1800, // 7 min
    softskill: 1800, // 5 min
  }), []);

  // time left (seconds) for current activeTab
  const [timeLeft, setTimeLeft] = useState(SECTION_TIMERS[activeTab] || 0);

  useEffect(() => {
    if (!sessionId) return;
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // whenever activeTab changes, reset timer to that section's duration
  useEffect(() => {
    setTimeLeft(SECTION_TIMERS[activeTab]);
  }, [activeTab, SECTION_TIMERS]);

  // timer tick
  useEffect(() => {
    if (!session) return; // don't tick until session is loaded

    if (timeLeft <= 0) {
      // handle timer expiry
      handleTimerExpiry(activeTab);
      return;
    }

    const t = setInterval(() => {
      setTimeLeft((s) => s - 1);
    }, 1000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, activeTab, session]); // re-run if section or session changes

  async function fetchSession() {
    try {
      setLoading(true);
      const r = await fetch(`/api/session/${sessionId}`);
      const j = await r.json();
      setLoading(false);
      if (j.ok) {
        setSession(j.session || j.data || null);

        // if the session already has scores/report flags, set completion flags
        if (j.session?.scores?.aptitude > 0 || (j.session?.answers || []).some(a => a.section === 'apti')) {
          setAptiCompleted(true);
        }
        if (j.session?.reportGenerated) {
          // If report already generated we can mark everything completed
          setAptiCompleted(true);
          setTechCompleted(true);
          setSoftCompleted(true);
        }
        // If there are saved voice answers, mark them completed in the set
        const initialCompleted = new Set();
        (j.session?.answers || []).forEach(a => {
          if (a.section === 'technical' || a.section === 'softskill') {
            initialCompleted.add(`${a.section}_${a.questionIndex}`);
          }
        });
        setCompletedVoice(initialCompleted);
      } else {
        alert("Failed to fetch session");
      }
    } catch (e) {
      setLoading(false);
      console.error(e);
      alert("Error fetching session");
    }
  }

  // arrays of questions (fallbacks kept)
  const aptiArray = session?.generatedQuestions?.aptitude || session?.generatedQuestions?.apti || [];
  const technicalArray = session?.generatedQuestions?.technical || [];
  const softArray = session?.generatedQuestions?.softskill || session?.generatedQuestions?.soft || [];

  const tabs = [
    { id: "aptitude", label: "Aptitude", icon: FileText, count: aptiArray.length, completed: aptiCompleted },
    { id: "technical", label: "Technical", icon: Mic, count: technicalArray.length, completed: techCompleted },
    { id: "softskill", label: "Soft Skills", icon: Mic, count: softArray.length, completed: softCompleted },
  ];

  function formatTime(s) {
    if (s <= 0) return "00:00";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function canSwitchTo(tabId) {
    // technical locked until aptitude done
    if (tabId === "technical" && !aptiCompleted) return false;
    // soft locked until technical done
    if (tabId === "softskill" && !techCompleted) return false;
    return true;
  }

  async function handleTabClick(tabId) {
    if (tabId === activeTab) return;
    // If trying to open a locked tab, show alert
    if (!canSwitchTo(tabId)) {
      if (tabId === "technical") return alert("Please complete the Aptitude section first.");
      if (tabId === "softskill") return alert("Please complete the Technical section first.");
      return;
    }

    // If leaving a section with unsaved changes (e.g., aptitude not submitted or voice in-progress),
    // ask for confirmation. For simplicity we only check aptitude unsaved and voice unanswered count.
    if (activeTab === "aptitude" && !aptiCompleted) {
      // check if user has selected at least one answer for aptitude
      const answeredCount = Object.keys(aptiAnswers).length;
      if (answeredCount > 0) {
        const ok = confirm("You have unsaved aptitude selections. If you leave, they will not be submitted. Continue?");
        if (!ok) return;
      } else {
        const ok = confirm("You haven't submitted the Aptitude section yet. You must submit before moving on. Continue without submitting?");
        if (!ok) return;
      }
    }

    // For voice sections: warn if there are unanswered questions
    if ((activeTab === "technical" || activeTab === "softskill") && !isSectionAllCompleted(activeTab)) {
      const unanswered = countUnansweredInSection(activeTab);
      if (unanswered > 0) {
        const ok = confirm(`You have ${unanswered} unanswered question(s) in ${activeTab}. If you leave, they will be skipped. Continue?`);
        if (!ok) return;
      }
    }

    setActiveTab(tabId);
  }

  function isSectionAllCompleted(sectionId) {
    const total = sectionId === "technical" ? technicalArray.length : softArray.length;
    if (!total) return true;
    let completed = 0;
    completedVoice.forEach(k => {
      if (k.startsWith(sectionId + "_")) completed++;
    });
    return completed >= total;
  }

  function countUnansweredInSection(sectionId) {
    const total = sectionId === "technical" ? technicalArray.length : softArray.length;
    let completed = 0;
    completedVoice.forEach(k => {
      if (k.startsWith(sectionId + "_")) completed++;
    });
    return Math.max(0, total - completed);
  }

  // Called by each VoiceQuestion when it successfully uploads an answer
  function handleVoiceSubmitSuccess(section, qIndex) {
    setCompletedVoice((prev) => {
      const next = new Set(prev);
      next.add(`${section}_${qIndex}`);
      return next;
    });

    // if all technical answered, mark technical complete and move to soft automatically
    if (section === "technical") {
      const totalTech = technicalArray.length;
      const nowCompleted = Array.from(completedVoice).filter(k => k.startsWith("technical_")).length + 1; // include this one
      if (nowCompleted >= totalTech) {
        setTechCompleted(true);
        alert("Technical section completed. Moving to Soft Skills.");
        setActiveTab("softskill");
        return;
      }
    }

    if (section === "softskill") {
      const totalSoft = softArray.length;
      const nowCompleted = Array.from(completedVoice).filter(k => k.startsWith("softskill_")).length + 1;
      if (nowCompleted >= totalSoft) {
        setSoftCompleted(true);
        alert("Softskill section completed.");
      }
    }
  }

  // Aptitude submit - updated to set aptiCompleted and move to technical
  async function submitMCQ() {
    const answers = Object.entries(aptiAnswers).map(([k, v]) => ({
      questionIndex: Number(k),
      selectedOptionIndex: v,
    }));

    // Ensure at least one answer selected
    if (!answers.length) {
      const ok = confirm("You haven't selected any aptitude answers. Are you sure you want to submit empty responses?");
      if (!ok) return;
    }

    try {
      const res = await fetch("/api/admin/interviews/submit-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers }),
      });
      const j = await res.json();
      if (j.ok) {
        setAptiCompleted(true);
        alert("Aptitude submitted. Moving to Technical section.");
        setActiveTab("technical");
      } else {
        alert("Submission failed");
      }
    } catch (err) {
      console.error("submitMCQ error", err);
      alert("Submission error");
    }
  }

  // Timer expiry handler
  async function handleTimerExpiry(sectionId) {
    if (sectionId === "aptitude") {
      // auto-submit aptitude
      alert("Time is up for Aptitude. Auto-submitting answers and moving to Technical.");
      await submitMCQ();
      return;
    }

    if (sectionId === "technical") {
      // move to softskill; mark technical completed (even if not fully answered)
      setTechCompleted(true);
      alert("Time is up for Technical. Moving to Soft Skills.");
      setActiveTab("softskill");
      return;
    }

    if (sectionId === "softskill") {
      // finish interview
      setSoftCompleted(true);
      alert("Time is up for Soft Skills. Interview will be completed.");
      await finishInterview();
      return;
    }
  }

  // Finish interview — call your finish API and redirect
  async function finishInterview() {
    try {
      const res = await fetch("/api/admin/interviews/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const j = await res.json();
      if (j.ok) {
        // Redirect to thank-you
        router.push(`/interview/${slug}/thank-you`);
      } else {
        alert("Error completing interview");
      }
    } catch (err) {
      console.error("finish error", err);
      alert("Finish error");
    }
  }

  // Helper to render completion badge
  function renderBadge(sectionId) {
    if (sectionId === "aptitude" && aptiCompleted) return <span className="ml-2 text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" />Done</span>;
    if (sectionId === "technical" && techCompleted) return <span className="ml-2 text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" />Done</span>;
    if (sectionId === "softskill" && softCompleted) return <span className="ml-2 text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" />Done</span>;
    return null;
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Interview Assessment</h1>
          <p className="text-gray-600">Complete all sections to finish your interview</p>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-white flex-shrink-0 mt-1" />
            <div className="text-white">
              <h3 className="font-semibold text-lg mb-1">Important Instructions</h3>
              <p className="text-white/90">
                1. Complete the aptitude MCQs first, then proceed to voice sections<br />
                2. Each voice answer should be concise and clear<br />
                3. Ensure good audio quality before recording
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200 bg-gray-50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const disabled = !canSwitchTo(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  disabled={disabled}
                  className={`flex-1 px-6 py-4 font-semibold transition-all relative ${activeTab === tab.id
                    ? "text-blue-600 bg-white"
                    : disabled ? "text-gray-400 bg-gray-50 cursor-not-allowed opacity-60" : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
                        }`}
                    >
                      {tab.count}
                    </span>

                    {/* completion badge */}
                    {renderBadge(tab.id)}
                  </div>
                  {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>}
                </button>
              );
            })}
          </div>

          {/* Tab Content + Timer */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">Section timer (auto-advance when it ends)</div>
              <div className="text-sm font-mono text-gray-800">{formatTime(timeLeft)}</div>
            </div>

            {/* Aptitude Tab */}
            {activeTab === "aptitude" && (
              <div className="space-y-4">
                {aptiArray.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No aptitude questions available</div>
                ) : (
                  <>
                    {aptiArray.map((q, idx) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-sm"
                      >
                        <div className="font-semibold text-gray-800 mb-4 text-lg">
                          {idx + 1}. {q.prompt}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(q.options || []).map((opt, oi) => (
                            <label
                              key={oi}
                              className={`border-2 p-4 rounded-lg cursor-pointer transition-all ${aptiAnswers[idx] === oi
                                ? "border-blue-500 bg-blue-50 shadow-md"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name={`apti-${idx}`}
                                  onChange={() => setAptiAnswers({ ...aptiAnswers, [idx]: oi })}
                                  checked={aptiAnswers[idx] === oi}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-gray-700 font-medium">{opt}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between mt-6 items-center">
                      <div className="text-sm text-gray-600">Answered: {Object.keys(aptiAnswers).length}/{aptiArray.length}</div>
                      <div>
                        <button
                          onClick={submitMCQ}
                          className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        >
                          Submit Aptitude Answers
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Technical Tab */}
            {activeTab === "technical" && (
              <div className="space-y-4">
                {technicalArray.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No technical questions available</div>
                ) : (
                  <>
                    <div className="text-sm text-gray-600 mb-2">Completed: {Array.from(completedVoice).filter(k => k.startsWith("technical_")).length}/{technicalArray.length}</div>
                    {technicalArray.map((q, idx) => (
                      <VoiceQuestion
                        key={`tech-${idx}`}
                        sessionId={sessionId}
                        section="technical"
                        questionIndex={idx}
                        prompt={q.prompt || q.question || q}
                        onSubmitSuccess={(section, i) => handleVoiceSubmitSuccess(section, i)}
                      />
                    ))}
                    <div className="flex justify-end mt-4 gap-3">
                      <button
                        onClick={() => {
                          const unanswered = countUnansweredInSection("technical");
                          if (unanswered > 0) {
                            const ok = confirm(`You still have ${unanswered} unanswered technical question(s). Submit finished?`);
                            if (!ok) return;
                          }
                          setTechCompleted(true);
                          alert("Technical section marked completed. Moving to Soft Skills.");
                          setActiveTab("softskill");
                        }}
                        className="px-6 py-2 bg-gray-800 text-white rounded"
                      >
                        Finish Technical
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Softskill Tab */}
            {activeTab === "softskill" && (
              <div className="space-y-4">
                {softArray.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No soft skill questions available</div>
                ) : (
                  <>
                    <div className="text-sm text-gray-600 mb-2">Completed: {Array.from(completedVoice).filter(k => k.startsWith("softskill_")).length}/{softArray.length}</div>
                    {softArray.map((q, idx) => (
                      <VoiceQuestion
                        key={`soft-${idx}`}
                        sessionId={sessionId}
                        section="softskill"
                        questionIndex={idx}
                        prompt={q.prompt || q.question || q}
                        onSubmitSuccess={(section, i) => handleVoiceSubmitSuccess(section, i)}
                      />
                    ))}
                    <div className="flex justify-end mt-4 gap-3">
                      <button
                        onClick={async () => {
                          const unanswered = countUnansweredInSection("softskill");
                          if (unanswered > 0) {
                            const ok = confirm(`You still have ${unanswered} unanswered softskill question(s). Are you sure you want to finish?`);
                            if (!ok) return;
                          }
                          setSoftCompleted(true);
                          await finishInterview();
                        }}
                        className="px-6 py-2 bg-gray-800 text-white rounded"
                      >
                        Finish Interview
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Finish Button - kept for manual finish if needed */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={async () => {
              const ok = confirm("Are you sure you want to finish the interview now?");
              if (!ok) return;
              await finishInterview();
            }}
            className="px-8 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl font-semibold hover:from-gray-900 hover:to-black shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Finish Interview
          </button>
        </div>
      </div>
    </div>
  );
}
















// File: pages/instructions/[sessionId].jsx
// "use client";
// import { useRouter } from "next/router";
// import { useEffect, useState } from "react";
// import { Mic, CheckCircle, Clock, FileText } from "lucide-react";
// import VoiceQuestion from "../../../components/VoiceQuestion";

// export default function InstructionsPage() {
//   const router = useRouter();
//   const { sessionId, slug } = router.query;
//   const [session, setSession] = useState(null);
//   const [aptiAnswers, setAptiAnswers] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("aptitude");

//   useEffect(() => {
//     if (!sessionId) return;
//     fetchSession();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [sessionId]);

//   async function fetchSession() {
//     try {
//       setLoading(true);
//       const r = await fetch(`/api/session/${sessionId}`);
//       const j = await r.json();
//       setLoading(false);
//       if (j.ok) setSession(j.session);
//       else alert("Failed to fetch session");
//     } catch (e) {
//       setLoading(false);
//       console.error(e);
//       alert("Error fetching session");
//     }
//   }

//   async function submitMCQ() {
//     const answers = Object.entries(aptiAnswers).map(([k, v]) => ({
//       questionIndex: Number(k),
//       selectedOptionIndex: v,
//     }));
//     const res = await fetch("/api/admin/interviews/submit-mcq", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ sessionId, answers }),
//     });
//     const j = await res.json();
//     if (j.ok) {
//       alert("Aptitude answers submitted. Proceed to voice sections.");
//       setActiveTab("technical");
//     } else {
//       alert("Submission failed");
//     }
//   }

//   if (loading || !session) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading interview...</p>
//         </div>
//       </div>
//     );
//   }

//   const aptiArray = session.generatedQuestions.aptitude || session.generatedQuestions.apti || [];
//   const technicalArray = session.generatedQuestions.technical || [];
//   const softArray = session.generatedQuestions.softskill || session.generatedQuestions.soft || [];

//   const tabs = [
//     { id: "aptitude", label: "Aptitude", icon: FileText, count: aptiArray.length },
//     { id: "technical", label: "Technical", icon: Mic, count: technicalArray.length },
//     { id: "softskill", label: "Soft Skills", icon: Mic, count: softArray.length },
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
//       <div className="max-w-6xl mx-auto p-6">
//         {/* Header */}
//         <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
//           <h1 className="text-3xl font-bold text-gray-800 mb-2">Interview Assessment</h1>
//           <p className="text-gray-600">Complete all sections to finish your interview</p>
//         </div>

//         {/* Instructions Banner */}
//         <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl shadow-lg p-6 mb-6">
//           <div className="flex items-start gap-3">
//             <Clock className="w-6 h-6 text-white flex-shrink-0 mt-1" />
//             <div className="text-white">
//               <h3 className="font-semibold text-lg mb-1">Important Instructions</h3>
//               <p className="text-white/90">
//                 1. Complete the aptitude MCQs first, then proceed to voice sections<br />
//                 2. Each voice answer should be concise and clear<br />
//                 3. Ensure good audio quality before recording
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
//           <div className="flex border-b border-gray-200 bg-gray-50">
//             {tabs.map((tab) => {
//               const Icon = tab.icon;
//               return (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`flex-1 px-6 py-4 font-semibold transition-all relative ${activeTab === tab.id
//                     ? "text-blue-600 bg-white"
//                     : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
//                     }`}
//                 >
//                   <div className="flex items-center justify-center gap-2">
//                     <Icon className="w-5 h-5" />
//                     <span>{tab.label}</span>
//                     <span
//                       className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
//                         }`}
//                     >
//                       {tab.count}
//                     </span>
//                   </div>
//                   {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>}
//                 </button>
//               );
//             })}
//           </div>

//           {/* Tab Content */}
//           <div className="p-6">
//             {/* Aptitude Tab */}
//             {activeTab === "aptitude" && (
//               <div className="space-y-4">
//                 {aptiArray.length === 0 ? (
//                   <div className="text-center py-12 text-gray-500">No aptitude questions available</div>
//                 ) : (
//                   <>
//                     {aptiArray.map((q, idx) => (
//                       <div
//                         key={idx}
//                         className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-sm"
//                       >
//                         <div className="font-semibold text-gray-800 mb-4 text-lg">
//                           {idx + 1}. {q.prompt}
//                         </div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                           {(q.options || []).map((opt, oi) => (
//                             <label
//                               key={oi}
//                               className={`border-2 p-4 rounded-lg cursor-pointer transition-all ${aptiAnswers[idx] === oi
//                                 ? "border-blue-500 bg-blue-50 shadow-md"
//                                 : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
//                                 }`}
//                             >
//                               <div className="flex items-center gap-3">
//                                 <input
//                                   type="radio"
//                                   name={`apti-${idx}`}
//                                   onChange={() => setAptiAnswers({ ...aptiAnswers, [idx]: oi })}
//                                   checked={aptiAnswers[idx] === oi}
//                                   className="w-4 h-4 text-blue-600"
//                                 />
//                                 <span className="text-gray-700 font-medium">{opt}</span>
//                               </div>
//                             </label>
//                           ))}
//                         </div>
//                       </div>
//                     ))}
//                     <div className="flex justify-end mt-6">
//                       <button
//                         onClick={submitMCQ}
//                         className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
//                       >
//                         Submit Aptitude Answers
//                       </button>
//                     </div>
//                   </>
//                 )}
//               </div>
//             )}

//             {/* Technical Tab */}
//             {activeTab === "technical" && (
//               <div className="space-y-4">
//                 {technicalArray.length === 0 ? (
//                   <div className="text-center py-12 text-gray-500">No technical questions available</div>
//                 ) : (
//                   technicalArray.map((q, idx) => (
//                     <VoiceQuestion
//                       key={`tech-${idx}`}
//                       sessionId={sessionId}
//                       section="technical"
//                       questionIndex={idx}
//                       prompt={q.prompt || q.question || q}
//                     />
//                   ))
//                 )}
//               </div>
//             )}

//             {/* Softskill Tab */}
//             {activeTab === "softskill" && (
//               <div className="space-y-4">
//                 {softArray.length === 0 ? (
//                   <div className="text-center py-12 text-gray-500">No soft skill questions available</div>
//                 ) : (
//                   softArray.map((q, idx) => (
//                     <VoiceQuestion
//                       key={`soft-${idx}`}
//                       sessionId={sessionId}
//                       section="softskill"
//                       questionIndex={idx}
//                       prompt={q.prompt || q.question || q}
//                     />
//                   ))
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Finish Button */}
//         <div className="mt-6 flex justify-center">
//           <button
//             // Replace the finish button onClick with:
//             onClick={async () => {
//               const res = await fetch("/api/admin/interviews/finish", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ sessionId }),
//               });

//               const j = await res.json();

//               if (j.ok) {
                
//                 router.push(`/interview/${slug}/thank-you`);
//               } else {
//                 alert("Error completing interview");
//               }
//             }}

//             className="px-8 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl font-semibold hover:from-gray-900 hover:to-black shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
//           >
//             Finish Interview
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


