import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function superAdminDashboard() {
  const router = useRouter();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Credit Modal States
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
const [showOnboardingModal, setShowOnboardingModal] = useState(false);
const [selectedOnboarding, setSelectedOnboarding] = useState(null);

 useEffect(() => {
  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/superadmin/dashboard", {
        credentials: "include",
      });

      if (!res.ok) {
        router.replace("/superadmin/login");
        return;
      }

      const data = await res.json();

      if (!data.success) {
        router.replace("/superadmin/login");
        return;
      }

      setCompanies(data.companies);
      setLoading(false);

    } catch (error) {
      router.replace("/superadmin/login");
    }
  };

  fetchDashboard();
}, []);


  const resetModal = () => {
    setShowCreditModal(false);
    setCompanyName("");
    setCompanyId(null);
    setCreditAmount("");
    setStep(1);
    setError("");
  };

  const handleValidateCompany = async () => {
    setError("");

    const res = await fetch("/api/superadmin/validateCompany", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: companyName }),
    });

    const data = await res.json();

    if (!data.success) {
      setError("Company not found");
      return;
    }

    setCompanyId(data.companyId);
    setStep(2);
  };

  const handleAddCredits = async () => {
    const amount = parseInt(creditAmount);

    if (!amount || amount <= 0) {
      setError("Enter valid credit amount");
      return;
    }

    await fetch("/api/superadmin/addCredits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, amount }),
    });

    alert("Credits added successfully");
    resetModal();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-lg font-semibold animate-pulse">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Super Admin Dashboard
        </h1>

        <div className="flex gap-3">
           <button
    onClick={() => router.push("/superadmin/invoices")}
    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
  >
    Invoices
  </button>
          <button
            onClick={() => setShowCreditModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            Add Credits
          </button>

          <button
            onClick={() => {
              document.cookie = "token=; Max-Age=0; path=/;";
              router.push("/superadmin/login");
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Companies"
          value={companies.length}
        />
        <StatCard
          title="Total Interviews"
          value={companies.reduce((acc, c) => acc + c.totalInterviews, 0)}
        />
        <StatCard
          title="Completed Onboarding"
          value={companies.filter(c => c.onboardingCompleted).length}
        />
      </div>

      {/* Company Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-200 text-gray-700 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 text-left">Company</th>
                <th className="px-6 py-4 text-left">Credits</th>
                <th className="px-6 py-4 text-left">Onboarding</th>
                <th className="px-6 py-4 text-left">Interviews</th>
                <th className="px-6 py-4 text-left">Created</th>
                <th className="px-6 py-4 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {companies.map((company) => (
                <tr
                  key={company._id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 font-semibold">
                    {company.name}
                  </td>

                  <td className="px-6 py-4">
                    {company.credits}
                  </td>

                  <td className="px-6 py-4">
                    {company.onboardingCompleted ? (
                      <span className="text-green-600 font-semibold">
                        Done
                      </span>
                    ) : (
                      <span className="text-red-500 font-semibold">
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {company.totalInterviews}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">
  <button
    disabled={!company.onboardingCompleted}
    onClick={async () => {
      const res = await fetch(
        `/api/superadmin/company/${company._id}`
      );
      const data = await res.json();

      if (data.success) {
        setSelectedOnboarding(data.onboarding);
        setShowOnboardingModal(true);
      }
    }}
    className={`px-4 py-2 rounded-lg transition ${
      company.onboardingCompleted
        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
        : "bg-gray-300 text-gray-500 cursor-not-allowed"
    }`}
  >
    View
  </button>
</td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* Add Credits Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[400px]">

            {step === 1 && (
              <>
                <h2 className="text-lg font-bold mb-4">
                  Enter Company Name
                </h2>

                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full border p-3 rounded-lg mb-4"
                  placeholder="Company Name"
                />

                {error && (
                  <p className="text-red-500 text-sm mb-2">{error}</p>
                )}

                <button
                  onClick={handleValidateCompany}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg"
                >
                  Validate
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-lg font-bold mb-4">
                  Enter Credit Amount
                </h2>

                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="w-full border p-3 rounded-lg mb-4"
                  placeholder="Credits"
                  min="1"
                />

                {error && (
                  <p className="text-red-500 text-sm mb-2">{error}</p>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg"
                  >
                    Back
                  </button>

                  <button
                    onClick={handleAddCredits}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    Submit
                  </button>
                </div>
              </>
            )}

            <button
              onClick={resetModal}
              className="mt-4 text-sm text-gray-500 underline"
            >
              Close
            </button>

          </div>
        </div>
      )}
{showOnboardingModal && selectedOnboarding && (
  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

      {/* Header */}
      <div className="flex justify-between items-center px-8 py-6 border-b sticky top-0 bg-white z-10">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          {selectedOnboarding.companyName}
          <span className="block text-sm font-normal text-gray-500 mt-1">
            Onboarding Details
          </span>
        </h2>

        <button
          onClick={() => setShowOnboardingModal(false)}
          className="text-gray-500 hover:text-red-500 transition text-lg"
        >
          ✕
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto px-8 py-6 space-y-8">

        {/* Basic Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <Detail label="Industry" value={selectedOnboarding.industry} />
          <Detail label="Company Type" value={selectedOnboarding.companyType} />
          <Detail label="GST Number" value={selectedOnboarding.gstNumber} />
          <Detail label="Employee Size" value={selectedOnboarding.employeeSize} />
          <Detail label="Hierarchy Level" value={selectedOnboarding.hierarchyLevel} />
          <Detail label="Communication Style" value={selectedOnboarding.communicationStyle} />
          {/* <Detail label="Collaboration Style" value={selectedOnboarding.collaborationStyle} /> */}
          <Detail label="Feedback Culture" value={selectedOnboarding.feedbackCulture} />
          <Detail label="Target Market" value={selectedOnboarding.targetMarket} />
          <Detail label="Work Pressure" value={selectedOnboarding.workPressure} />
          <Detail label="Payment Status" value={selectedOnboarding.paymentStatus} />
          {/* <Detail label="Credits Remaining" value={selectedOnboarding.creditsRemaining} /> */}
        </div>

        {/* Address Section */}
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-2">
            Registered Address
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg text-gray-600 text-sm border">
            {selectedOnboarding.registeredAddress || "-"}
          </div>
        </div>

        {/* Payment Proof */}
        {selectedOnboarding.paymentProof && (
          <div>
            <h3 className="text-md font-semibold text-gray-700 mb-3">
              Payment Proof
            </h3>
            <div className="border rounded-xl overflow-hidden w-full md:w-80">
              <img
                src={selectedOnboarding.paymentProof}
                alt="Payment Proof"
                className="w-full object-cover"
              />
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="px-8 py-4 border-t bg-gray-50 flex justify-end sticky bottom-0">
        <button
          onClick={() => setShowOnboardingModal(false)}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition shadow-sm"
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}

    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-gray-500 text-sm mb-2">{title}</h3>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
function Detail({ label, value }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </p>
      <p className="text-gray-800 font-medium">
        {value || "-"}
      </p>
    </div>
  );
}

