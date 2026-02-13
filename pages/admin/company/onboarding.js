// import { useState, useEffect } from "react";
// import { useRouter } from "next/router";

// export default function CompanyOnboarding() {
//   const router = useRouter();
//   const [step, setStep] = useState(1);
//   const [loading, setLoading] = useState(true); // Start as true to wait for data fetch
//   const [errors, setErrors] = useState({});
//   const [showQRModal, setShowQRModal] = useState(false);

//   useEffect(() => {
//     if (!router.isReady) return;

//     // 1. Handle step from query parameter
//     if (router.query.step) {
//       setStep(parseInt(router.query.step) || 1);
//     }

//     // 2. Fetch existing data
//     fetchData();
//   }, [router.isReady, router.query.step]);

//   const fetchData = async () => {
//     try {
//       const res = await fetch("/api/admin/company/onboarding", { credentials: "include" });
//       const data = await res.json();
//       if (data.ok && data.onboarding) {
//         setForm({
//           companyName: data.onboarding.companyName || "",
//           industry: data.onboarding.industry || "",
//           companyType: data.onboarding.companyType || "",
//           registeredAddress: data.onboarding.registeredAddress || "",
//           gstNumber: data.onboarding.gstNumber || "",
//           employeeSize: data.onboarding.employeeSize || 0,
//           hierarchyLevel: data.onboarding.hierarchyLevel || "",
//           targetMarket: data.onboarding.targetMarket || "",
//           sampleClients: Array.isArray(data.onboarding.sampleClients)
//             ? data.onboarding.sampleClients.join(", ")
//             : data.onboarding.sampleClients || "",
//           communicationStyle: data.onboarding.communicationStyle || "",
//           collaborationStyle: data.onboarding.collaborationStyle || "",
//           feedbackCulture: data.onboarding.feedbackCulture || "",
//           workPressure: data.onboarding.workPressure || "",
//           onboardingChallenges: data.onboarding.onboardingChallenges || "",
//           paymentProof: data.onboarding.paymentProof || "",
//         });
//       }
//     } catch (err) {
//       console.error("Failed to fetch onboarding data:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ---------------- FORM ---------------- */
//   const [form, setForm] = useState({
//     companyName: "",
//     industry: "",
//     companyType: "",
//     registeredAddress: "",
//     gstNumber: "",
//     employeeSize: 0,
//     hierarchyLevel: "",
//     targetMarket: "",
//     sampleClients: "",
//     communicationStyle: "",
//     collaborationStyle: "",
//     feedbackCulture: "",
//     workPressure: "",
//     onboardingChallenges: "",
//     paymentProof: "", // Base64 or URL
//   });

//   const handleChange = (key, value) => {
//     setForm((p) => ({ ...p, [key]: value }));
//     setErrors((e) => ({ ...e, [key]: null }));
//   };

//   /* ---------------- VALIDATION ---------------- */
//   const validateStep = () => {
//     const e = {};

//     if (step === 1) {
//       if (!form.companyName.trim()) e.companyName = "Company name is required";
//       if (!form.industry.trim()) e.industry = "Industry is required";
//       if (!form.companyType) e.companyType = "Select company type";
//       if (!form.registeredAddress.trim()) e.registeredAddress = "Registered address is required";
//       if (!form.gstNumber.trim()) {
//         e.gstNumber = "GST number is required";
//       } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstNumber.toUpperCase())) {
//         e.gstNumber = "Invalid GST format. Example: 22AAAAA0000A1Z5";
//       }
//       if (!form.employeeSize || isNaN(form.employeeSize)) e.employeeSize = "Employee size is required and must be a number";
//     }

//     if (step === 2) {
//       if (!form.hierarchyLevel) e.hierarchyLevel = "Select hierarchy level";
//       if (!form.communicationStyle) e.communicationStyle = "Select communication style";
//       if (!form.feedbackCulture) e.feedbackCulture = "Select feedback culture";
//     }

//     if (step === 3) {
//       if (!form.targetMarket.trim()) e.targetMarket = "Target market is required";
//       if (!form.workPressure) e.workPressure = "Select work pressure";
//     }

//     if (step === 4) {
//       if (!form.paymentProof) e.paymentProof = "Payment proof screenshot is required";
//     }

//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const next = () => validateStep() && setStep((s) => s + 1);
//   const back = () => setStep((s) => s - 1);

//   /* ---------------- SUBMIT ---------------- */
//   const handleSubmit = async () => {
//     if (!validateStep()) return;

//     setLoading(true);

//     const payload = {
//       ...form,
//     };


//     try {
//       const res = await fetch("/api/admin/company/onboarding", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();

//       if (data.ok) {
//         router.push("/admin");
//       } else {
//         alert(data.message || "Failed to save onboarding");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ---------------- UI ---------------- */
//   return (
//     <>
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
//       {loading ? (
//         <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600 font-medium">Loading your information...</p>
//         </div>
//       ) : (
//         <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl p-6 sm:p-8">

//           <h1 className="text-2xl font-semibold text-gray-900">
//             Company Onboarding
//           </h1>
//           <p className="text-sm text-gray-600 mt-1 mb-6">
//             Step {step} of 4 · Used to generate interviews & culture insights
//           </p>

//           <div className="flex gap-2 mb-8">
//             {[1, 2, 3, 4].map((s) => (
//               <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? "bg-indigo-600" : "bg-gray-200"}`} />
//             ))}
//           </div>

//           {step === 1 && (
//             <Section title="Basic Company Information">
//               <Input label="Company Name *" value={form.companyName} onChange={(v) => handleChange("companyName", v)} error={errors.companyName} />
//               <Input label="Industry *" value={form.industry} onChange={(v) => handleChange("industry", v)} error={errors.industry} />
//               <Select label="Company Type *" value={form.companyType} onChange={(v) => handleChange("companyType", v)} options={["Startup", "MNC", "PSU", "Family Business","SME (Small & Medium Enterprise)",
//   "Private Limited Company",]} error={errors.companyType} />
//               <Input label="Reg Address *" value={form.registeredAddress} onChange={(v) => handleChange("registeredAddress", v)} error={errors.registeredAddress} placeholder="Complete registered address" />
//               <Input
//                 label="GST Number *"
//                 value={form.gstNumber}
//                 onChange={(v) => handleChange("gstNumber", v.toUpperCase())}
//                 error={errors.gstNumber}
//                 placeholder="22AAAAA0000A1Z5"
//                 maxLength={15}
//               />
//               <Input label="Employee Size *" value={form.employeeSize} onChange={(v) => handleChange("employeeSize", v)} type="number" error={errors.employeeSize} placeholder="e.g. 50" min="0" />
//             </Section>
//           )}

//           {step === 2 && (
//             <Section title="Work Culture">
//               <Select label="Hierarchy Level *" value={form.hierarchyLevel} onChange={(v) => handleChange("hierarchyLevel", v)} options={["Flat", "Moderate", "Strict"]} error={errors.hierarchyLevel} />
//               <Select label="Communication Style *" value={form.communicationStyle} onChange={(v) => handleChange("communicationStyle", v)} options={["formal", "informal", "email-heavy", "chat-based", "meeting-driven"]} error={errors.communicationStyle} />
//               <Select label="Feedback Culture *" value={form.feedbackCulture} onChange={(v) => handleChange("feedbackCulture", v)} options={["frequent", "rare", "safe", "avoided", "hierarchical"]} error={errors.feedbackCulture} />
//             </Section>
//           )}

//           {step === 3 && (
//             <Section title="Clients & Pressure">
//               <Input label="Target Market *" value={form.targetMarket} onChange={(v) => handleChange("targetMarket", v)} error={errors.targetMarket} />
//               <Input label="Sample Clients" value={form.sampleClients} onChange={(v) => handleChange("sampleClients", v)} />
//               <Select label="Work Pressure *" value={form.workPressure} onChange={(v) => handleChange("workPressure", v)} options={["low", "medium", "high"]} error={errors.workPressure} />
//               <Textarea label="Onboarding Challenges" value={form.onboardingChallenges} onChange={(v) => handleChange("onboardingChallenges", v)} />
//             </Section>
//           )}

//           {step === 4 && (
//             <Section title="Payment Confirmation">
//               <div className="md:col-span-2 bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex flex-col md:flex-row gap-6 items-center">
//                 <div className="flex-1">
//                   <h3 className="text-lg font-bold text-indigo-900 mb-2">Interview Credit Package</h3>
//                   <ul className="space-y-2 text-indigo-800 text-sm">
//                     <li className="flex justify-between"><span>5 Credits (250 / credit)</span> <span>₹1,250.00</span></li>
//                     <li className="flex justify-between border-b border-indigo-200 pb-2"><span>GST (18%)</span> <span>₹225.00</span></li>
//                     <li className="flex justify-between font-bold text-base pt-2"><span>Total Amount</span> <span>₹1,475.00</span></li>
//                   </ul>
//                   <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-indigo-200">
//                     <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-bold">How to pay:</p>
//                     <ol className="text-sm text-gray-700 space-y-1 list-decimal ml-4">
//                       <li>Scan the QR code shown here</li>
//                       <li>Pay exactly <strong>₹1,475.00</strong></li>
//                       <li>Take a screenshot of the successful payment</li>
//                       <li>Upload it below to finish onboarding</li>
//                     </ol>
//                   </div>
//                 </div>
//                 <div
//                   className="w-48 h-auto bg-white p-2 rounded-lg shadow-md border border-gray-200 cursor-zoom-in hover:scale-105 transition-transform"
//                   onClick={() => setShowQRModal(true)}
//                 >
//                   <img src="/payment-qr.png" alt="Payment QR" className="w-full h-full object-contain" />
//                   <p className="text-[10px] text-center mt-2 text-gray-500 font-medium uppercase">Click to Enlarge</p>
//                 </div>
//               </div>

//               {/* QR Code Zoom Modal */}
//               {showQRModal && (
//                 <div
//                   className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
//                   onClick={() => setShowQRModal(false)}
//                 >
//                   <div className="relative bg-white p-4 rounded-2xl shadow-2xl max-w-sm w-full transform transition-all scale-110">
//                     <button
//                       className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 z-10"
//                       onClick={() => setShowQRModal(false)}
//                     >
//                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
//                     </button>
//                     <div className="bg-gray-900 rounded-xl p-4 flex flex-col items-center">
//                       <img src="/payment-qr.png" alt="Payment QR Enlarged" className="w-full h-auto rounded-lg" />
//                       <p className="mt-4 text-white font-bold tracking-widest text-lg">SHAKKTII UPI</p>
//                       <p className="text-gray-400 text-xs mt-1">Scan and pay ₹1,475.00</p>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="md:col-span-2">
//                 <label className="text-sm font-medium block mb-2 text-gray-700">Upload Payment Screenshot *</label>
//                 <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${errors.paymentProof ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-indigo-400'}`}>
//                   <div className="space-y-1 text-center">
//                     {!form.paymentProof ? (
//                       <>
//                         <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
//                           <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//                         </svg>
//                         <div className="flex text-sm text-gray-600">
//                           <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
//                             <span>Upload a file</span>
//                             <input
//                               id="file-upload"
//                               name="file-upload"
//                               type="file"
//                               className="sr-only"
//                               accept="image/*"
//                               onChange={(e) => {
//                                 const file = e.target.files[0];
//                                 if (file) {
//                                   const reader = new FileReader();
//                                   reader.onloadend = () => {
//                                     handleChange("paymentProof", reader.result);
//                                   };
//                                   reader.readAsDataURL(file);
//                                 }
//                               }}
//                             />
//                           </label>
//                           <p className="pl-1">or drag and drop</p>
//                         </div>
//                         <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
//                       </>
//                     ) : (
//                       <div className="relative">
//                         <img src={form.paymentProof} alt="Payment Proof" className="max-h-48 mx-auto rounded-lg shadow-sm" />
//                         <button
//                           onClick={() => handleChange("paymentProof", "")}
//                           className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
//                         >
//                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//                 {errors.paymentProof && <p className="text-xs text-red-600 mt-2">{errors.paymentProof}</p>}
//               </div>
//             </Section>
//           )}

//           <div className="flex justify-between mt-8">
//             <button onClick={back} disabled={step === 1} className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50 hover:bg-gray-300 transition-colors">
//               Back
//             </button>

//             {step < 4 ? (
//               <button onClick={next} className="px-6 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">
//                 Continue
//               </button>
//             ) : (
//               <button onClick={handleSubmit} disabled={loading} className="px-8 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md disabled:bg-indigo-300 font-bold">
//                 {loading ? "Processing..." : "Finish & Submit Onboarding"}
//               </button>
//             )}
//           </div>
//         </div>
//       )}
     

//     </div>
//      <footer className="bg-white border-t mt-10">
//   <div className="max-w-7xl mx-auto px-6 py-8">

//     <div className="flex flex-col md:flex-row 
//                     items-center justify-between 
//                     gap-8 text-center md:text-left">

//       {/* LEFT - Contact */}
//       <div>
//         <p className="text-sm font-semibold text-gray-900">
//           Contact Us
//         </p>
//         <a
//           href="mailto:connect@mockmingle.in"
//           className="text-sm text-indigo-600 hover:text-indigo-700 transition"
//         >
//           connect@mockmingle.in
//         </a>
//       </div>

//       {/* RIGHT - Logo + Powered By */}
//       <div className="flex flex-col items-center md:items-center">

//         {/* Logo */}
//         <img
//           src="/MM_LOGO.png"
//           alt="MockMingle Logo"
//           className="h-10 mb-2 object-contain"
//         />

//         {/* Powered By */}
//         <p className="text-xs md:text-sm text-gray-500">
//           © {new Date().getFullYear()} Powered by{" "}
//           <span className="font-semibold text-gray-700">
//             MockMingle.in
//           </span>
//         </p>

//       </div>

//     </div>

//   </div>
// </footer>
//     </>
//   );
// }

// /* ---------------- UI HELPERS ---------------- */

// function Section({ title, children }) {
//   return (
//     <div>
//       <h2 className="text-lg font-semibold mb-4">{title}</h2>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
//     </div>
//   );
// }

// function Input({ label, value, onChange, error, placeholder, maxLength, type = "text", min }) {
//   return (
//     <div>
//       <label className="text-sm font-medium">{label}</label>
//       <input
//         type={type}
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className="w-full px-4 py-3 border rounded"
//         placeholder={placeholder}
//         maxLength={maxLength}
//         min={min}
//       />
//       {error && <p className="text-xs text-red-600">{error}</p>}
//     </div>
//   );
// }

// function Select({ label, value, onChange, options, error }) {
//   return (
//     <div>
//       <label className="text-sm font-medium">{label}</label>
//       <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 border rounded">
//         <option value="">Select</option>
//         {options.map((o) => <option key={o}>{o}</option>)}
//       </select>
//       {error && <p className="text-xs text-red-600">{error}</p>}
//     </div>
//   );
// }

// function Textarea({ label, value, onChange }) {
//   return (
//     <div className="md:col-span-2">
//       <label className="text-sm font-medium">{label}</label>
//       <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 border rounded" />
//     </div>
//   );
// }
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function CompanyOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    companyName: "",
    companyLogo: "", // ✅ added
    industry: "",
    companyType: "",
    registeredAddress: "",
    gstNumber: "",
    employeeSize: 0,
    hierarchyLevel: "",
    targetMarket: "",
    sampleClients: "",
    communicationStyle: "",
    collaborationStyle: "",
    feedbackCulture: "",
    workPressure: "",
    onboardingChallenges: "",
  });

  useEffect(() => {
    if (!router.isReady) return;

    if (router.query.step) {
      setStep(parseInt(router.query.step) || 1);
    }

    fetchData();
  }, [router.isReady, router.query.step]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/company/onboarding", {
        credentials: "include",
      });
      const data = await res.json();

      if (data.ok && data.onboarding) {
        setForm({
          companyName: data.onboarding.companyName || "",
          companyLogo: data.onboarding.companyLogo || "", // ✅ preload
          industry: data.onboarding.industry || "",
          companyType: data.onboarding.companyType || "",
          registeredAddress: data.onboarding.registeredAddress || "",
          gstNumber: data.onboarding.gstNumber || "",
          employeeSize: data.onboarding.employeeSize || 0,
          hierarchyLevel: data.onboarding.hierarchyLevel || "",
          targetMarket: data.onboarding.targetMarket || "",
          sampleClients: Array.isArray(data.onboarding.sampleClients)
            ? data.onboarding.sampleClients.join(", ")
            : data.onboarding.sampleClients || "",
          communicationStyle: data.onboarding.communicationStyle || "",
          collaborationStyle: data.onboarding.collaborationStyle || "",
          feedbackCulture: data.onboarding.feedbackCulture || "",
          workPressure: data.onboarding.workPressure || "",
          onboardingChallenges: data.onboarding.onboardingChallenges || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch onboarding data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  /* ---------------- VALIDATION ---------------- */
  const validateStep = () => {
    const e = {};

    if (step === 1) {
      if (!form.companyName.trim()) e.companyName = "Company name is required";
      if (!form.companyLogo) e.companyLogo = "Company logo is required"; // ✅ added
      if (!form.industry.trim()) e.industry = "Industry is required";
      if (!form.companyType) e.companyType = "Select company type";
      if (!form.registeredAddress.trim())
        e.registeredAddress = "Registered address is required";

      if (!form.gstNumber.trim()) {
        e.gstNumber = "GST number is required";
      } else if (
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
          form.gstNumber.toUpperCase()
        )
      ) {
        e.gstNumber = "Invalid GST format. Example: 22AAAAA0000A1Z5";
      }

      if (!form.employeeSize || isNaN(form.employeeSize))
        e.employeeSize = "Employee size is required";
    }

    if (step === 2) {
      if (!form.hierarchyLevel)
        e.hierarchyLevel = "Select hierarchy level";
      if (!form.communicationStyle)
        e.communicationStyle = "Select communication style";
      if (!form.feedbackCulture)
        e.feedbackCulture = "Select feedback culture";
      if (!form.targetMarket.trim())
        e.targetMarket = "Target market is required";
      if (!form.workPressure)
        e.workPressure = "Select work pressure";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validateStep() && setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      const res = await fetch("/api/admin/company/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.ok) {
        router.push("/admin/company/payment");
      } else {
        alert(data.message || "Failed to save onboarding");
      }
    } catch (err) {
      alert("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      <div className="flex-grow flex items-center justify-center px-4 py-8">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl p-6 sm:p-8">

          <h1 className="text-2xl font-semibold text-gray-900">
            Company Onboarding
          </h1>

          <p className="text-sm text-gray-600 mt-1 mb-6">
            Step {step} of 2
          </p>

          {/* STEP 1 */}
          {step === 1 && (
            <Section title="Basic Company Information">
              <Input label="Company Name *"
                value={form.companyName}
                onChange={(v) => handleChange("companyName", v)}
                error={errors.companyName}
              />

              {/* ✅ LOGO UPLOAD SECTION */}
              <div>
  <label className="text-sm font-medium text-gray-700 block mb-2">
    Company Logo *
  </label>

  <div
    className={`w-full border rounded-lg px-4 py-4 flex items-center justify-between transition
      ${errors.companyLogo ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-indigo-400"}
    `}
  >
    {/* Preview */}
    {form.companyLogo ? (
      <div className="flex items-center gap-4 w-full">
        <div className="h-14 w-20 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border">
          <img
            src={form.companyLogo}
            alt="Logo Preview"
            className="object-contain max-h-full max-w-full"
          />
        </div>

        

        <button
          type="button"
          onClick={() => handleChange("companyLogo", "")}
          className="text-xs px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition"
        >
          Remove
        </button>
      </div>
    ) : (
      <>
        <span className="text-sm text-gray-500">
          Upload company logo (PNG/JPG, max 5MB)
        </span>

        <input
          type="file"
          id="logoUpload"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
              alert("Logo must be under 5MB");
              return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
              handleChange("companyLogo", reader.result);
            };
            reader.readAsDataURL(file);
          }}
        />

        <label
          htmlFor="logoUpload"
          className="cursor-pointer text-sm px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          Upload
        </label>
      </>
    )}
  </div>

  {errors.companyLogo && (
    <p className="text-xs text-red-600 mt-2">
      {errors.companyLogo}
    </p>
  )}
</div>

              <Input label="Industry *"
                value={form.industry}
                onChange={(v) => handleChange("industry", v)}
                error={errors.industry}
              />

              <Select label="Company Type *"
                value={form.companyType}
                onChange={(v) => handleChange("companyType", v)}
                options={["Startup","MNC","PSU","Family Business","Private Limited"]}
                error={errors.companyType}
              />

              <Input label="Registered Address *"
                value={form.registeredAddress}
                onChange={(v) => handleChange("registeredAddress", v)}
                error={errors.registeredAddress}
              />

              <Input label="GST Number *"
                value={form.gstNumber}
                onChange={(v) => handleChange("gstNumber", v.toUpperCase())}
                error={errors.gstNumber}
                maxLength={15}
              />

              <Input label="Employee Size *"
                value={form.employeeSize}
                onChange={(v) => handleChange("employeeSize", v)}
                type="number"
                error={errors.employeeSize}
              />
            </Section>
          )}

          {/* STEP 2 (unchanged) */}
          {step === 2 && (
            <Section title="Work Culture & Clients">
              <Select label="Hierarchy Level *"
                value={form.hierarchyLevel}
                onChange={(v) => handleChange("hierarchyLevel", v)}
                options={["Flat","Moderate","Strict"]}
                error={errors.hierarchyLevel}
              />
              <Select label="Communication Style *"
                value={form.communicationStyle}
                onChange={(v) => handleChange("communicationStyle", v)}
                options={["formal","informal","meeting-driven"]}
                error={errors.communicationStyle}
              />
              <Select label="Feedback Culture *"
                value={form.feedbackCulture}
                onChange={(v) => handleChange("feedbackCulture", v)}
                options={["frequent","rare","safe"]}
                error={errors.feedbackCulture}
              />
              <Input label="Target Market *"
                value={form.targetMarket}
                onChange={(v) => handleChange("targetMarket", v)}
                error={errors.targetMarket}
              />
              <Select label="Work Pressure *"
                value={form.workPressure}
                onChange={(v) => handleChange("workPressure", v)}
                options={["low","medium","high"]}
                error={errors.workPressure}
              />
              <Textarea label="Onboarding Challenges"
                value={form.onboardingChallenges}
                onChange={(v) => handleChange("onboardingChallenges", v)}
              />
            </Section>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={back} disabled={step === 1}
              className="px-4 py-2 rounded bg-gray-200">
              Back
            </button>

            {step < 2 ? (
              <button onClick={next}
                className="px-6 py-2 rounded bg-indigo-600 text-white">
                Continue
              </button>
            ) : (
              <button onClick={handleSubmit}
                className="px-8 py-2 rounded bg-indigo-600 text-white">
                Save & Continue
              </button>
            )}
          </div>

        </div>
        
      </div>
      {/* FOOTER */}
      <footer className="bg-white ">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-8 text-center md:text-left">

            {/* LEFT - Contact */}
            
            {/* RIGHT - Logo + Powered By */}
            <div className="flex flex-col items-center md:items-center">
              <img
                src="/MM_LOGO.png"
                alt="MockMingle Logo"
                className="h-10 mb-2 object-contain"
              />
              <p className="text-xs md:text-sm text-gray-500">
                © {new Date().getFullYear()} Powered by{" "}
                <span className="font-semibold text-gray-700">
                  MockMingle.in
                </span>
              </p>
            </div>

          </div>
        </div>
      </footer>

    </div>
    
  );
}

/* UI Helpers */

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, error, type="text", maxLength }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        maxLength={maxLength}
        className="w-full px-4 py-3 border rounded"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Select({ label, value, onChange, options, error }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full px-4 py-3 border rounded"
      >
        <option value="">Select</option>
        {options.map((o)=><option key={o}>{o}</option>)}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <div className="md:col-span-2">
      <label className="text-sm font-medium">{label}</label>
      <textarea
        rows={4}
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full px-4 py-3 border rounded"
      />
    </div>
  );
}
