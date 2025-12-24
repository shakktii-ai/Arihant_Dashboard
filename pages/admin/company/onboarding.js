import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function CompanyOnboarding() {
  const router = useRouter();
  /* ---------------- STEPS ---------------- */
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  /* ---------------- FORM ---------------- */
  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    companyType: "",
    location: "",
    employeeSize: "",
    hierarchyLevel: "",
    targetMarket: "",
    sampleClients: "",
    communicationStyle: "",
    collaborationStyle: "",
    feedbackCulture: "",
    workPressure: "",
    onboardingChallenges: "",
  });

  const handleChange = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  /* ---------------- VALIDATION ---------------- */
  const validateStep = () => {
    const e = {};

    if (step === 1) {
      if (!form.companyName.trim()) e.companyName = "Company name is required";
      if (!form.industry.trim()) e.industry = "Industry is required";
      if (!form.companyType) e.companyType = "Select company type";
      if (!form.location.trim()) e.location = "Location is required";
    }

    if (step === 2) {
      if (!form.hierarchyLevel) e.hierarchyLevel = "Select hierarchy level";
      if (!form.communicationStyle) e.communicationStyle = "Select communication style";
      if (!form.feedbackCulture) e.feedbackCulture = "Select feedback culture";
    }

    if (step === 3) {
      if (!form.targetMarket.trim()) e.targetMarket = "Target market is required";
      if (!form.workPressure) e.workPressure = "Select work pressure";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validateStep() && setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);

   const payload = {
  ...form,
};


    try {
      const res = await fetch("/api/admin/company/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials:"include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.ok) {
        router.push("/admin");
      } else {
        alert(data.message || "Failed to save onboarding");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl p-6 sm:p-8">

        <h1 className="text-2xl font-semibold text-gray-900">
          Company Onboarding
        </h1>
        <p className="text-sm text-gray-600 mt-1 mb-6">
          Step {step} of 3 · Used to generate interviews & culture insights
        </p>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? "bg-indigo-600" : "bg-gray-200"}`} />
          ))}
        </div>

        {step === 1 && (
          <Section title="Basic Company Information">
            <Input label="Company Name *" value={form.companyName} onChange={(v) => handleChange("companyName", v)} error={errors.companyName} />
            <Input label="Industry *" value={form.industry} onChange={(v) => handleChange("industry", v)} error={errors.industry} />
            <Select label="Company Type *" value={form.companyType} onChange={(v) => handleChange("companyType", v)} options={["Startup", "MNC", "PSU", "Family Business"]} error={errors.companyType} />
            <Input label="Location *" value={form.location} onChange={(v) => handleChange("location", v)} error={errors.location} />
          <Input label="Employee Size" value={form.employeeSize} onChange={(v) => handleChange("employeeSize", v)} />
          </Section>
        )}

        {step === 2 && (
          <Section title="Work Culture">
            <Select label="Hierarchy Level *" value={form.hierarchyLevel} onChange={(v) => handleChange("hierarchyLevel", v)} options={["Flat", "Moderate", "Strict"]} error={errors.hierarchyLevel} />
            <Select label="Communication Style *" value={form.communicationStyle} onChange={(v) => handleChange("communicationStyle", v)} options={["formal", "informal", "email-heavy", "chat-based", "meeting-driven"]} error={errors.communicationStyle} />
            <Select label="Feedback Culture *" value={form.feedbackCulture} onChange={(v) => handleChange("feedbackCulture", v)} options={["frequent", "rare", "safe", "avoided", "hierarchical"]} error={errors.feedbackCulture} />
          </Section>
        )}

        {step === 3 && (
          <Section title="Clients & Pressure">
            <Input label="Target Market *" value={form.targetMarket} onChange={(v) => handleChange("targetMarket", v)} error={errors.targetMarket} />
            <Input label="Sample Clients" value={form.sampleClients} onChange={(v) => handleChange("sampleClients", v)} />
            <Select label="Work Pressure *" value={form.workPressure} onChange={(v) => handleChange("workPressure", v)} options={["low", "medium", "high"]} error={errors.workPressure} />
            <Textarea label="Onboarding Challenges" value={form.onboardingChallenges} onChange={(v) => handleChange("onboardingChallenges", v)} />
          </Section>
        )}

        <div className="flex justify-between mt-8">
          <button onClick={back} disabled={step === 1} className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50">
            Back
          </button>

          {step < 3 ? (
            <button onClick={next} className="px-6 py-2 rounded bg-indigo-600 text-white">
              Continue
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 rounded bg-indigo-600 text-white">
              {loading ? "Saving..." : "Finish Onboarding"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, error }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 border rounded" />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Select({ label, value, onChange, options, error }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 border rounded">
        <option value="">Select</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <div className="md:col-span-2">
      <label className="text-sm font-medium">{label}</label>
      <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 border rounded" />
    </div>
  );
}
