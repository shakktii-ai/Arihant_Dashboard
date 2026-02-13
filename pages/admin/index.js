// pages/admin/index.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { HiOutlineUserCircle } from "react-icons/hi";
import { CiLogout } from "react-icons/ci";
import { IoCreateOutline } from "react-icons/io5";
import jsPDF from "jspdf";
export default function AdminIndex() {
  const router = useRouter();

  // interviews
  const [interviews, setInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);

  // reports
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // credits
  const [credits, setCredits] = useState(0);
  const [companyInfo, setCompanyInfo] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState("interviews"); // interviews | reports
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [recommendFilter, setRecommendFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // create modal
  const [showCreate, setShowCreate] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    jobRole: "",
    jd: "",
    qualification: "",
    criteria: "",
    location: "",
    questions: {
      totalQuestions: 60,
      aptitude: 30,
      technical: 30,

    },
  });


  // report modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  // Interview Report Modal
  const [selectedInterviewReport, setSelectedInterviewReport] = useState(null);
  const [showInterviewReportModal, setShowInterviewReportModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    (async () => {
      await loadInterviews();
      await loadReports();
      await loadCompanyInfo();
    })();
  }, []);

  async function loadCompanyInfo() {
    try {
      let onboardingCredits = null;
      let paymentCredits = null;

      // 1️⃣ Load onboarding credits
      const onboardingRes = await fetch("/api/admin/company/onboarding", {
        credentials: "include",
      });
      const onboardingData = await onboardingRes.json();

      if (onboardingData.ok && onboardingData.onboarding) {
        setCompanyInfo(onboardingData.onboarding);

        if (
          onboardingData.onboarding.creditsRemaining !== undefined &&
          onboardingData.onboarding.creditsRemaining !== null
        ) {
          onboardingCredits = onboardingData.onboarding.creditsRemaining;
        }
      }

      // 2️⃣ Load payment credits
      const paymentRes = await fetch("/api/admin/company/payment", {
        credentials: "include",
      });
      const paymentData = await paymentRes.json();

      if (
        paymentData.ok &&
        paymentData.payment &&
        paymentData.payment.creditsRemaining !== undefined &&
        paymentData.payment.creditsRemaining !== null
      ) {
        paymentCredits = paymentData.payment.creditsRemaining;
      }

      // 3️⃣ Priority logic
      let finalCredits = 0;

      if (paymentCredits !== null && paymentCredits > 0) {
        finalCredits = paymentCredits;
      } else if (onboardingCredits !== null) {
        finalCredits = onboardingCredits;
      }

      setCredits(finalCredits);
      console.log("Onboarding credits:", onboardingCredits);
      console.log("Payment credits:", paymentCredits);

      console.log("Final Credits:", finalCredits);

    } catch (err) {
      console.error("Error loading company info:", err);
    }
  }

  async function loadInterviews() {
    console.log("typeof fetch =", typeof fetch);
    console.log("fetch value =", fetch);
    try {
      setLoadingInterviews(true);
      const res = await window.fetch("/api/admin/interviews", {
        credentials: "include",
      });

      const data = await res.json();
      if (data.ok) setInterviews(data.interviews || []);
    } catch (err) {
      console.error("fetchList error", err);
    } finally {
      setLoadingInterviews(false);
    }
  }

  async function loadReports() {
    try {
      setLoadingReports(true);
      const res = await window.fetch("/api/admin/reports", {
        credentials: "include",
      });

      const data = await res.json();
      if (data.ok) setReports(data.reports || []);
    } catch (err) {
      console.error("loadReports error", err);
    } finally {
      setLoadingReports(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();

    const v = validateForm();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    try {
      const payload = {
        ...form,
        clients: form.clients
          ? form.clients.split(",").map(c => c.trim()).filter(Boolean)
          : [],
      };

      const res = await fetch("/api/admin/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      console.log("CREATE RESPONSE:", data);

      if (data.ok) {
        loadInterviews();
        loadCompanyInfo(); // Refresh credits
        setShowCreate(false);
        alert("Job created successfully");
      } else {
        alert(data.error || "Error creating interview");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating interview");
    }
  }

  function validateForm() {
    let err = {};
    if (!form.jobRole.trim()) err.jobRole = "Job role is required";
    if (!form.jd.trim()) err.jd = "Job description is required";
    if (!form.qualification.trim()) err.qualification = "Qualification is required";
    if (!form.criteria.trim()) err.criteria = "Criteria is required";
    if (!form.location.trim()) err.location = "Location is required";


    const { aptitude, technical, totalQuestions } = form.questions;
    if (aptitude < 1) err.aptitude = "Must be at least 1";
    if (technical < 1) err.technical = "Must be at least 1";


    const sum = aptitude + technical;
    if (sum !== totalQuestions) err.total = `Total must be ${totalQuestions}, but got ${sum}`;
    return err;
  }

  async function toggleActive(id, current) {
    try {
      await fetch(`/api/admin/interviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      loadInterviews();
    } catch (err) {
      console.error("toggleActive error", err);
    }
  }

  function openReportModal(report) {
    setSelectedReport(report);
    setShowReportModal(true);
  }
  function closeReportModal() {
    setSelectedReport(null);
    setShowReportModal(false);
  }

  // Derived lists + filtering
  const roles = useMemo(() => {
    const set = new Set();
    interviews.forEach(i => i.jobRole && set.add(i.jobRole));
    reports.forEach(r => r.role && set.add(r.role));
    return ["all", ...Array.from(set)];
  }, [interviews, reports]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter(r => {
      if (roleFilter !== "all" && (r.role || "Unknown") !== roleFilter) return false;
      if (recommendFilter !== "all") {
        const rec = (r.reportAnalysis?.recommendation || "Report Pending");
        if (rec !== recommendFilter) return false;
      }
      if (statusFilter !== "all") {
        const status = r.reportAnalysis ? "done" : "pending";
        if (status !== statusFilter) return false;
      }
      if (!q) return true;
      return (r.email || "").toLowerCase().includes(q) || (r.role || "").toLowerCase().includes(q);
    });
  }, [reports, search, roleFilter, recommendFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const pageItems = filteredReports.slice((page - 1) * pageSize, page * pageSize);

  const exportCSV = (list) => {
    if (!list.length) return;
    const header = ["Email", "Role", "Recommendation", "Answered", "Total", "Date"];
    const rows = list.map(r => {
      const rec = r.reportAnalysis?.recommendation || "Report Pending";
      return [
        r.email || "",
        r.role || "",
        rec,
        r.reportAnalysis?.answeredCount || 0,
        r.reportAnalysis?.totalQuestions || 0,
        new Date(r.createdAt).toLocaleString()
      ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadReportPDF = (report) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Helper function to add text with word wrap
    const addText = (text, x, y, maxWidth, fontSize = 10, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.5);
    };

    // Header
    doc.setFillColor(79, 70, 229); // Indigo
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Candidate Report", margin, 25);

    doc.setTextColor(0, 0, 0);
    yPos = 50;

    // Candidate Info
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Candidate Information", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Email: ${report.email || "N/A"}`, margin, yPos);
    yPos += 7;
    doc.text(`Role: ${report.role || "N/A"}`, margin, yPos);
    yPos += 7;
    doc.text(`Date: ${new Date(report.createdAt).toLocaleString()}`, margin, yPos);
    yPos += 15;

    // Recommendation Badge
    const recommendation = report.reportAnalysis?.recommendation || "Pending";
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Recommendation:", margin, yPos);

    // Set color based on recommendation
    if (recommendation === "Proceed") {
      doc.setTextColor(22, 163, 74); // Green
    } else if (recommendation === "Borderline") {
      doc.setTextColor(234, 179, 8); // Yellow
    } else {
      doc.setTextColor(220, 38, 38); // Red
    }
    doc.text(recommendation, margin + 50, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 15;

    // Role Fit
    if (report.reportAnalysis?.roleFit) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Role Fit", margin, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const roleFitText = `${report.reportAnalysis.roleFit.match} - ${report.reportAnalysis.roleFit.explanation}`;
      yPos = addText(roleFitText, margin, yPos, pageWidth - 2 * margin);
      yPos += 10;
    }

    // Scores
    if (report.reportAnalysis?.scores) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Scorecard", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      Object.entries(report.reportAnalysis.scores).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        doc.text(`${label}: ${value}/10`, margin, yPos);
        yPos += 7;
      });

      yPos += 5;
      doc.setFont("helvetica", "bold");
      doc.text(`Overall Score: ${report.reportAnalysis.overallScore || 0} / 60`, margin, yPos);
      yPos += 15;
    }

    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    // Evaluation Text
    if (report.reportAnalysis?.evaluationText) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Detailed Evaluation", margin, yPos);
      yPos += 10;

      Object.entries(report.reportAnalysis.evaluationText).forEach(([key, value]) => {
        if (key !== "overallSummary") {
          // Check if we need a new page
          if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = margin;
          }

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          const sectionTitle = key.replace(/([A-Z])/g, ' $1').trim();
          doc.text(sectionTitle, margin, yPos);
          yPos += 7;

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          yPos = addText(value, margin, yPos, pageWidth - 2 * margin);
          yPos += 10;
        }
      });
    }

    // Overall Summary
    if (report.reportAnalysis?.evaluationText?.overallSummary) {
      // Check if we need a new page
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFillColor(219, 234, 254); // Light blue
      doc.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 10, 'F');

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Overall Assessment Summary", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      yPos = addText(report.reportAnalysis.evaluationText.overallSummary, margin, yPos, pageWidth - 2 * margin);
      yPos += 10;
    }

    // Improvement Resources
    if (report.reportAnalysis?.improvementResources) {
      // Check if we need a new page
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Recommended Improvement Areas", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const allResources = Object.values(report.reportAnalysis.improvementResources).flat();
      allResources.forEach((item, idx) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = margin;
        }
        yPos = addText(`• ${item}`, margin, yPos, pageWidth - 2 * margin);
        yPos += 5;
      });
    }

    // Footer
    const totalPagesExp = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPagesExp; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${totalPagesExp}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const fileName = `${report.email?.replace(/[^a-z0-9]/gi, '_')}_report_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  };
  const downloadInterviewPDF = (report) => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = margin;

    doc.setFontSize(18);
    doc.text("Interview Evaluation Report", margin, y);
    y += 15;

    doc.setFontSize(11);
    doc.text(`Email: ${report.email}`, margin, y);
    y += 8;
    doc.text(`Role: ${report.role}`, margin, y);
    y += 15;

    const lines = doc.splitTextToSize(
      report.reportAnalysis || "",
      pageWidth - margin * 2
    );

    doc.text(lines, margin, y);

    doc.save(
      `${report.email.replace(/[^a-z0-9]/gi, "_")}_interview_report.pdf`
    );
  };

  function Field({ label, error, children }) {
    return (
      <div className="flex flex-col">
        {label && (
          <label className="text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        {children}
        {error && (
          <span className="text-xs text-red-600 mt-1">
            {error}
          </span>
        )}
      </div>
    );
  }
  function Pagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Page <span className="font-semibold">{page}</span> of{" "}
          <span className="font-semibold">{totalPages}</span>
        </p>

        <div className="flex items-center gap-2">
          {/* Prev */}
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className={`px-3 py-1.5 text-sm rounded-lg border transition
            ${page === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-50"
              }`}
          >
            Prev
          </button>

          {/* Numbers */}
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition
              ${p === page
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white hover:bg-gray-50"
                }`}
            >
              {p}
            </button>
          ))}

          {/* Next */}
          <button
            onClick={() =>
              onPageChange(Math.min(totalPages, page + 1))
            }
            disabled={page === totalPages}
            className={`px-3 py-1.5 text-sm rounded-lg border transition
            ${page === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-50"
              }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // ================= INTERVIEW PAGINATION =================
  const interviewPageSize = 8;

  const interviewTotalPages = Math.max(
    1,
    Math.ceil(interviews.length / interviewPageSize)
  );

  const interviewPageItems = interviews.slice(
    (page - 1) * interviewPageSize,
    page * interviewPageSize
  );
  async function openInterviewReport(email, role) {
    try {
      const res = await fetch(
        `/api/admin/interview-reports?email=${email}&role=${role}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (data.ok && data.report) {
        setSelectedInterviewReport(data.report);
        setShowInterviewReportModal(true);
      } else {
        alert("Interview report not found");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading interview report");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">

        {/* header */}
        <div className="mb-6">

          {/* TOP ROW */}
          <div className="flex items-center justify-between">

            {/* LEFT LOGO */}
            {/* <img
              src="/arihant-logo.png"
              alt="Arihant Superstructures"
              className="h-8 sm:h-10 md:h-12 w-auto"
            /> */}
            <img
              src={companyInfo?.companyLogo || "/arihant-logo.png"}
              alt={companyInfo?.companyName || "Company Logo"}
              className="h-12 md:h-16 w-fit object-contain"
            />

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-3 sm:gap-5">



              {/* PROFILE */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileMenu(!showProfileMenu);
                  }}
                  className="flex items-center justify-center 
               w-9 h-9 sm:w-10 sm:h-10 
               rounded-full bg-white shadow-md 
               hover:shadow-lg hover:bg-gray-50 
               transition-all duration-200"
                >
                  <HiOutlineUserCircle className="w-6 h-6 text-gray-700" />
                </button>

                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-3 w-72 
                 bg-white rounded-2xl shadow-2xl 
                 border border-gray-100 
                 z-50 overflow-hidden animate-fadeIn"
                  >
                    {/* Header */}
                    <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-white border-b">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {companyInfo?.companyName}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">Available Credits</span>
                        <span className="text-sm font-semibold text-indigo-600">
                          {credits}
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          if (credits <= 0) {
                            alert("You have 0 credits. Please buy credits to create interview.");
                            return;
                          }
                          setShowCreate(true);
                        }}
                        className="flex items-center gap-3 
                     w-full px-5 py-3 text-sm 
                     text-gray-700 hover:bg-gray-50 
                     transition"
                      >
                        <IoCreateOutline />
                        Create Interview
                      </button>

                      {credits === 0 && (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            router.push("/admin/company/payment");

                          }}
                          className="flex items-center gap-3 
                       w-full px-5 py-3 text-sm 
                       text-gray-700 hover:bg-gray-50 
                       transition"
                        >
                          <span className="">+</span>
                          Buy Credits
                        </button>
                      )}

                      <div className="border-t my-2"></div>

                      <button
                        onClick={() => {
                          document.cookie = "token=; Max-Age=0; path=/;";
                          router.push("/admin/login");
                        }}
                        className="flex items-center gap-3 
                     w-full px-5 py-3 text-sm 
                     text-red-600 hover:bg-red-50 
                     transition"
                      >
                        <CiLogout />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* MM Logo */}
              {/* <img
                src="/MM_LOGO.png"
                alt="MockMingle"
                className="h-7 sm:h-9 md:h-10 w-auto"
              /> */}
            </div>
          </div>

          {/* TAGLINE BELOW */}
          <p className="mt-3 text-[10px] sm:text-[11px] md:text-[12px] 
                 text-slate-500 font-medium tracking-[0.2em] 
                 uppercase opacity-70 flex flex-wrap items-center gap-2">
            <span>Manage Interviews</span>
            <span className="h-1 w-1 rounded-full bg-indigo-300"></span>
            <span>AI Reports</span>
            <span className="h-1 w-1 rounded-full bg-indigo-300"></span>
            <span>Shortlist</span>
          </p>

        </div>


        {/* tabs + filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => {
                    setActiveTab("interviews");
                    setPage(1);
                  }}

                  className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "interviews" ? "bg-white text-gray-900 shadow" : "text-gray-600"}`}
                >
                  Interviews
                </button>
                <button
                  onClick={() => { setActiveTab("reports"); setPage(1) }}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "reports" ? "bg-white text-gray-900 shadow" : "text-gray-600"}`}
                >
                  Reports
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search email or role"
                  className="px-3 py-2 border rounded-md text-sm w-52 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
                  {roles.map(r => <option key={r} value={r}>{r === "all" ? "All roles" : r}</option>)}
                </select>
                <select value={recommendFilter} onChange={(e) => setRecommendFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
                  <option value="all">Any recommendation</option>
                  <option value="Proceed">Proceed</option>
                  <option value="Borderline">Borderline</option>
                  <option value="Cannot Proceed">Cannot Proceed</option>
                </select>

              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                {activeTab === "reports" && (
                  <>Showing <span className="font-medium">{filteredReports.length}</span> reports</>
                )}
                {activeTab === "interviews" && (
                  <>Showing <span className="font-medium">{interviews.length}</span> interviews</>
                )}
              </div>

            </div>
          </div>

          {/* responsive small controls */}
          <div className="mt-3 sm:hidden flex gap-2">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search email or role"
              className="px-3 py-2 border rounded-md text-sm w-full"
            />
          </div>
        </div>

        {/* content */}
        <div >
          <div>
            {/* ⭐ SHOW INTERVIEWS ONLY IF TAB = interviews */}
            {activeTab === "interviews" && (
              <div className="lg:col-span-7">

                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">Interviews</h3>
                    <div className="text-sm text-gray-500">{loadingInterviews ? "Loading..." : `${interviews.length} created`}</div>
                  </div>

                  {/* responsive cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {interviewPageItems.map((iv) => (
                      <div
                        key={iv._id}
                        className="group bg-white border border-gray-200 rounded-2xl 
                 shadow-sm hover:shadow-lg transition-all duration-300 
                 p-6 flex flex-col justify-between"
                      >
                        {/* Top Section */}
                        <div>
                          {/* Status + Toggle */}
                          <div className="flex items-center justify-between mb-4">
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full 
            ${iv.isActive
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : "bg-gray-100 text-gray-600 border border-gray-200"
                                }`}
                            >
                              {iv.isActive ? "Active" : "Inactive"}
                            </span>

                            <button
                              onClick={() => toggleActive(iv._id, iv.isActive)}
                              className="text-xs px-3 py-1.5 rounded-lg 
                       bg-indigo-50 text-indigo-600 
                       hover:bg-indigo-100 transition"
                            >
                              Toggle Status
                            </button>
                          </div>

                          {/* Job Role */}
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition">
                            {iv.jobRole || "Untitled Role"}
                          </h3>

                          {/* JD */}
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                            {iv.jd
                              ? iv.jd.slice(0, 200) +
                              (iv.jd.length > 200 ? "…" : "")
                              : "No job description provided."}
                          </p>

                          {/* Meta Info */}
                          <div className="mt-4 space-y-1 text-sm text-gray-500">
                            <div>
                              <span className="font-medium text-gray-700">
                                Qualification:
                              </span>{" "}
                              {iv.qualification}
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Criteria:
                              </span>{" "}
                              {iv.criteria}
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Location:
                              </span>{" "}
                              {iv.location}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Section */}
                        <div className="mt-6 pt-4 border-t">
                          <a
                            href={`/interview/${iv.slug}/apply`}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-sm text-indigo-600 hover:text-indigo-700 
                     font-medium break-all transition"
                          >
                            /interview/{iv.slug}/apply
                          </a>

                          <div className="text-xs text-gray-400 mt-2">
                            Created on {new Date(iv.createdAt).toLocaleString()}
                          </div>
                        </div>

                      </div>
                    ))}

                  </div>

                  {/* fallback */}
                  {interviews.length === 0 && !loadingInterviews && (
                    <div className="text-center text-gray-500 p-8">No interviews created yet.</div>
                  )}
                  <Pagination
                    page={page}
                    totalPages={interviewTotalPages}
                    onPageChange={setPage}
                  />

                </div>



              </div>
            )}


            {/*  SHOW REPORTS ONLY IF TAB = reports */}
            {activeTab === "reports" && (
              <div className="lg:col-span-5">

                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">Candidate Reports</h3>
                    <div className="text-sm text-gray-500">{loadingReports ? "Loading..." : `${reports.length} total`}</div>
                  </div>

                  {/* small summary badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="px-3 py-1 bg-green-50 text-green-800 rounded-full text-sm">Proceed: {reports.filter(r => r.reportAnalysis?.recommendation === "Proceed").length}</div>
                    <div className="px-3 py-1 bg-yellow-50 text-yellow-800 rounded-full text-sm">Borderline: {reports.filter(r => r.reportAnalysis?.recommendation === "Borderline").length}</div>
                    <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Pending: {reports.filter(r => !r.reportAnalysis).length}</div>
                  </div>

                  {/* reports table (responsive) */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500">
                          <th className="py-2 pr-4">Email</th>
                          <th className="py-2 pr-4">Role</th>
                          <th className="py-2 pr-4">Recommendation</th>
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">Report</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.length === 0 && (
                          <tr>
                            <td colSpan="5" className="py-6 text-center text-gray-400">No reports match your filters</td>
                          </tr>
                        )}
                        {pageItems.map(r => (
                          <tr key={r._id} className="border-t">
                            <td className="py-3 pr-4">{r.email}</td>
                            <td className="py-3 pr-4">{r.role}</td>
                            <td className="py-3 pr-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${r.reportAnalysis?.recommendation === "Proceed" ? "bg-green-50 text-green-700" : r.reportAnalysis?.recommendation === "Borderline" ? "bg-yellow-50 text-yellow-700" : "bg-gray-100 text-gray-800"}`}>
                                {r.reportAnalysis?.recommendation || "Pending"}
                              </span>
                            </td>
                            <td className="py-3 pr-4">{new Date(r.createdAt).toLocaleString()}</td>
                            <td className="py-3 pr-4">
                              <div className="flex gap-2">
                                <button onClick={() => openReportModal(r)} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">Assessment</button>
                                <button
                                  onClick={() => openInterviewReport(r.email, r.role)}
                                  className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                                >
                                  Interview
                                </button>

                                {/* <button
                                  onClick={() => downloadReportPDF(r)}
                                  className={`px-3 py-1 rounded text-sm ${r.reportAnalysis
                                    ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                  disabled={!r.reportAnalysis}
                                  title={!r.reportAnalysis ? "Report not yet generated" : "Download PDF"}
                                >
                                  PDF
                                </button> */}
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              {r.shortlisted && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  <IoMdCheckmarkCircleOutline className="text-sm" />
                                  Shortlisted
                                </span>

                              )
                              }
                            </td>


                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* pagination */}
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />

                </div>
              </div>

            )}
          </div>
        </div>
        {/* Create Modal */}
        {/* ================= CREATE INTERVIEW MODAL ================= */}
        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">

              {/* Header */}
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create Interview
                </h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-gray-400 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleCreate}
                className="px-6 py-6 overflow-y-auto space-y-6 flex-1"
              >

                {/* Job Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Role *
                  </label>
                  <input
                    value={form.jobRole}
                    onChange={(e) =>
                      setForm({ ...form, jobRole: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl 
                       bg-gray-50 text-gray-900 text-sm
                       focus:bg-white focus:outline-none 
                       focus:ring-2 focus:ring-indigo-200 
                       focus:border-indigo-500 transition-all"
                    placeholder="e.g. Frontend Developer"
                  />
                  {errors.jobRole && (
                    <p className="text-xs text-red-600 mt-2">{errors.jobRole}</p>
                  )}
                </div>

                {/* Job Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    rows={4}
                    value={form.jd}
                    onChange={(e) =>
                      setForm({ ...form, jd: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl 
                       bg-gray-50 text-gray-900 text-sm
                       focus:bg-white focus:outline-none 
                       focus:ring-2 focus:ring-indigo-200 
                       focus:border-indigo-500 transition-all"
                    placeholder="Enter detailed job description..."
                  />
                  {errors.jd && (
                    <p className="text-xs text-red-600 mt-2">{errors.jd}</p>
                  )}
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualification *
                  </label>
                  <input
                    value={form.qualification}
                    onChange={(e) =>
                      setForm({ ...form, qualification: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl 
                       bg-gray-50 text-gray-900 text-sm
                       focus:bg-white focus:outline-none 
                       focus:ring-2 focus:ring-indigo-200 
                       focus:border-indigo-500 transition-all"
                    placeholder="e.g. B.Tech / MCA"
                  />
                  {errors.qualification && (
                    <p className="text-xs text-red-600 mt-2">
                      {errors.qualification}
                    </p>
                  )}
                </div>

                {/* Criteria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selection Criteria *
                  </label>
                  <input
                    value={form.criteria}
                    onChange={(e) =>
                      setForm({ ...form, criteria: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl 
                       bg-gray-50 text-gray-900 text-sm
                       focus:bg-white focus:outline-none 
                       focus:ring-2 focus:ring-indigo-200 
                       focus:border-indigo-500 transition-all"
                    placeholder="e.g. Minimum 2 years experience"
                  />
                  {errors.criteria && (
                    <p className="text-xs text-red-600 mt-2">{errors.criteria}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl 
                       bg-gray-50 text-gray-900 text-sm
                       focus:bg-white focus:outline-none 
                       focus:ring-2 focus:ring-indigo-200 
                       focus:border-indigo-500 transition-all"
                    placeholder="Bangalore, Pune, Noida"
                  />
                  {errors.location && (
                    <p className="text-xs text-red-600 mt-2">{errors.location}</p>
                  )}
                </div>

                {/* Question Configuration */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">
                    Question Distribution
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aptitude Questions *
                      </label>
                      <input
                        type="number"
                        value={form.questions.aptitude}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            questions: {
                              ...form.questions,
                              aptitude: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl 
                           bg-gray-50 text-gray-900 text-sm
                           focus:bg-white focus:outline-none 
                           focus:ring-2 focus:ring-indigo-200 
                           focus:border-indigo-500 transition-all"
                      />
                      {errors.aptitude && (
                        <p className="text-xs text-red-600 mt-2">
                          {errors.aptitude}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Technical Questions *
                      </label>
                      <input
                        type="number"
                        value={form.questions.technical}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            questions: {
                              ...form.questions,
                              technical: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl 
                           bg-gray-50 text-gray-900 text-sm
                           focus:bg-white focus:outline-none 
                           focus:ring-2 focus:ring-indigo-200 
                           focus:border-indigo-500 transition-all"
                      />
                      {errors.technical && (
                        <p className="text-xs text-red-600 mt-2">
                          {errors.technical}
                        </p>
                      )}
                    </div>
                  </div>

                  {errors.total && (
                    <p className="text-sm text-red-700 mt-3">{errors.total}</p>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-md transition"
                  >
                    Create Interview
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {/* ===========================
     BEAUTIFUL REPORT MODAL
    =========================== */}
        {showReportModal && selectedReport && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl p-6 overflow-auto max-h-[90vh] relative">

              {/* Close */}
              <button
                onClick={closeReportModal}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 text-xl"
              >
                ✕
              </button>

              {/* ================= HEADER ================= */}
              <div className="border-b pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {selectedReport.email}
                  </h2>
                  <p className="text-sm text-gray-600">{selectedReport.role}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Report generated on{" "}
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Recommendation Badge */}
                <div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold
              ${selectedReport.reportAnalysis?.recommendation === "Proceed"
                        ? "bg-green-100 text-green-700"
                        : selectedReport.reportAnalysis?.recommendation === "Borderline"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"}
            `}
                  >
                    {selectedReport.reportAnalysis?.recommendation}
                  </span>
                </div>
              </div>

              {/* ================= HIRING VERDICT ================= */}
              <div className="mt-6 p-5 rounded-lg border bg-gray-50">

                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong>Role Fit:</strong>{" "}
                  {selectedReport.reportAnalysis?.roleFit?.match} —{" "}
                  {selectedReport.reportAnalysis?.roleFit?.explanation}
                </p>
              </div>

              {/* ================= SCORECARD ================= */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Candidate Scorecard
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(selectedReport.reportAnalysis?.scores || {}).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="p-4 rounded-lg border bg-white shadow-sm"
                      >
                        <div className="text-sm font-medium text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, " $1")}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-2xl font-bold text-gray-900">
                            {value}/10
                          </div>
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div
                              className={`h-full rounded-full ${value >= 7
                                ? "bg-green-500"
                                : value >= 4
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                                }`}
                              style={{ width: `${(value / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <p className="text-sm text-gray-500 mt-3">
                  Overall Score:{" "}
                  <strong>
                    {selectedReport.reportAnalysis?.overallScore} / 60
                  </strong>
                </p>
              </div>

              {/* ================= DETAILED EVALUATION ================= */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Section-wise Evaluation
                </h3>

                <div className="space-y-4">
                  {Object.entries(
                    selectedReport.reportAnalysis?.evaluationText || {}
                  ).map(
                    ([key, value]) =>
                      key !== "overallSummary" && (
                        <div
                          key={key}
                          className="p-4 border rounded-lg bg-white shadow-sm"
                        >
                          <div className="font-medium text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, " $1")}
                          </div>
                          <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                            {value}
                          </p>
                        </div>
                      )
                  )}
                </div>
              </div>

              {/* ================= OVERALL SUMMARY ================= */}
              <div className="mt-8 p-5 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800">
                  Overall Assessment Summary
                </h3>
                <p className="text-sm text-blue-900 mt-2 leading-relaxed">
                  {selectedReport.reportAnalysis?.evaluationText?.overallSummary}
                </p>
              </div>

              {/* ================= IMPROVEMENT PLAN ================= */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Recommended Improvement Areas
                </h3>

                <div className="p-4 border bg-gray-50 rounded-lg">
                  <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
                    {Object.values(
                      selectedReport.reportAnalysis?.improvementResources || {}
                    )
                      .flat()
                      .map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                  </ul>
                </div>
              </div>

              {/* ================= ACTIONS ================= */}
              <div className="flex justify-between items-center mt-8">

                <div className="flex gap-3">

                  {/* Download PDF */}
                  <button
                    onClick={() => downloadReportPDF(selectedReport)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                  >
                    Download PDF
                  </button>

                  {/* Shortlist Toggle */}
                  <button
                    onClick={async () => {
                      const newStatus = !selectedReport.shortlisted;

                      const res = await fetch(
                        `/api/admin/reports/${selectedReport._id}`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ shortlisted: newStatus }),
                        }
                      );

                      const data = await res.json();
                      if (data.ok) {
                        setShowReportModal(false);
                        loadReports();
                      }
                    }}
                    className={`px-4 py-2 rounded-md text-white font-medium
      ${selectedReport.shortlisted ? "bg-red-600" : "bg-green-600"}`}
                  >
                    {selectedReport.shortlisted
                      ? "Remove from Shortlist"
                      : "Shortlist Candidate"}
                  </button>

                </div>

                <button
                  onClick={closeReportModal}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                >
                  Close
                </button>

              </div>

            </div>
          </div>
        )}

        {showInterviewReportModal && selectedInterviewReport && (() => {

          const text = selectedInterviewReport.reportAnalysis || "";

          /* =========================================================
             1️⃣ SCORE EXTRACTION (Robust & Flexible)
             Handles:
             - Technical Proficiency: 6/10
             - Decision-Making: 7/10
             - Decision Making: 7/10
             - With spaces / hyphen variations
          ========================================================= */

          const scoreRegex =
            /(Technical\s*Proficiency|Communication|Decision[-\s]*Making|Confidence|Language\s*Fluency)\s*:\s*(\d+)\s*\/\s*10/gi;

          const scores = [];
          let match;

          while ((match = scoreRegex.exec(text)) !== null) {
            scores.push({
              label: match[1].replace(/\s+/g, " ").trim(),
              value: Number(match[2])
            });
          }

          /* =========================================================
             2️⃣ OVERALL SCORE EXTRACTION
             Handles:
             - Overall: 25/50
             - Overall Score: 25/50
          ========================================================= */

          const overallRegex = /Overall(?:\s*Score)?\s*:\s*(\d+)\s*\/\s*(\d+)/i;
          const overallMatch = text.match(overallRegex);

          const overallScore = overallMatch ? Number(overallMatch[1]) : null;
          const overallTotal = overallMatch ? Number(overallMatch[2]) : null;

          /* =========================================================
             3️⃣ IMPROVEMENT SUGGESTIONS EXTRACTION
             Handles everything after:
             "Improvement Suggestions:"
          ========================================================= */

          const improvementRegex =
            /Improvement\s*Suggestions\s*:\s*([\s\S]*)/i;

          const improvementMatch = text.match(improvementRegex);

          const improvementText = improvementMatch
            ? improvementMatch[1].trim()
            : null;

          /* =========================================================
             4️⃣ MAIN ANALYSIS TEXT (Remove improvements section)
          ========================================================= */

          const mainText = improvementMatch
            ? text.replace(improvementRegex, "").trim()
            : text;

          return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl p-8 overflow-auto max-h-[90vh] relative">

                {/* Close */}
                <button
                  onClick={() => setShowInterviewReportModal(false)}
                  className="absolute right-5 top-5 text-gray-400 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>

                {/* Header */}
                <div className="border-b pb-4 mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Interview Evaluation Report
                  </h2>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Email:</strong> {selectedInterviewReport.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Role:</strong> {selectedInterviewReport.role}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Generated on {new Date(selectedInterviewReport.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* SCORE CARDS */}
                {scores.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                      Scorecard
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {scores.map((s, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl border bg-white shadow-sm"
                        >
                          <div className="text-sm font-medium text-gray-600">
                            {s.label}
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-2xl font-bold text-gray-900">
                              {s.value}/10
                            </div>

                            <div className="w-24 h-2 bg-gray-200 rounded-full">
                              <div
                                className={`h-full rounded-full ${s.value >= 7
                                  ? "bg-green-500"
                                  : s.value >= 4
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                  }`}
                                style={{ width: `${(s.value / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {overallScore && (
                      <p className="text-sm text-gray-600 mt-4">
                        <strong>Overall Score:</strong> {overallScore} / {overallTotal}
                      </p>
                    )}
                  </div>
                )}

                {/* MAIN ANALYSIS TEXT */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Detailed Evaluation
                  </h3>

                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border rounded-lg p-4 bg-gray-50">
                    {mainText}
                  </div>
                </div>

                {/* IMPROVEMENTS */}
                {improvementText && (
                  <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">
                      Improvement Suggestions
                    </h3>

                    <div className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">
                      {improvementText}
                    </div>
                  </div>
                )}
                <div className="flex justify-end mt-8 gap-3">

                  <button
                    onClick={() => downloadInterviewPDF(selectedInterviewReport)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                  >
                    Download PDF
                  </button>

                  <button
                    onClick={() => setShowInterviewReportModal(false)}
                    className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                  >
                    Close
                  </button>

                </div>

              </div>

            </div>
          );

        })()}

      </div>
      <footer className=" bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-6 py-8">

          <div className="flex flex-col md:flex-row 
                    items-center justify-between 
                    gap-6">

            <div className="text-center md:text-left">
              {/* <p className="text-sm font-semibold text-gray-900">
                Contact Us
              </p>
              <a
                href="mailto:connect@mockmingle.in"
                className="text-sm text-indigo-600 hover:text-indigo-700 transition"
              >
                connect@mockmingle.in
              </a> */}
            </div>

            <div className="flex flex-col items-center">

              <img
                src="/MM_LOGO.png"
                alt="MockMingle Logo"
                className="h-8 mb-2 object-contain flex item-center"
              />

              <p className="text-xs text-gray-500">
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
