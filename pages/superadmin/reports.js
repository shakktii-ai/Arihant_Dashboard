import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import jsPDF from "jspdf";
export default function SuperAdminReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [sortAsc, setSortAsc] = useState(true);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    // report modal
    const [selectedReport, setSelectedReport] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    // Interview Report Modal
    const [selectedInterviewReport, setSelectedInterviewReport] = useState(null);
    const [showInterviewReportModal, setShowInterviewReportModal] = useState(false);
    const [page, setPage] = useState(1);
    const pageSize = 12;

    useEffect(() => {
        setPage(1);

        const query = search.toLowerCase().trim();
        const nextReports = reports.filter((report) => {
            return (
                report.companyName.toLowerCase().includes(query) ||
                report.email.toLowerCase().includes(query) ||
                report.role.toLowerCase().includes(query) ||
                report.collegeName.toLowerCase().includes(query)
            );
        });

        setFilteredReports(nextReports);
    }, [search, reports]);
    useEffect(() => {
        fetch("/api/superadmin/reports", {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                if (!data.success) {
                    router.push("/superadmin/login");
                    return;
                }

                setReports(data.reports || []);
                setFilteredReports(data.reports || []);
                setLoading(false);
            })
            .catch(() => router.push("/superadmin/login"));
    }, []);

    useEffect(() => {
        const query = search.toLowerCase().trim();
        const nextReports = reports.filter((report) => {
            return (
                report.companyName.toLowerCase().includes(query) ||
                report.email.toLowerCase().includes(query) ||
                report.role.toLowerCase().includes(query) ||
                report.collegeName.toLowerCase().includes(query)
            );
        });

        setFilteredReports(nextReports);
    }, [search, reports]);

   const sortedReports = useMemo(() => {
  return [...filteredReports].sort((a, b) => {
    const nameA = (a.companyName || "").toLowerCase();
    const nameB = (b.companyName || "").toLowerCase();

    if (nameA < nameB) return sortAsc ? -1 : 1;
    if (nameA > nameB) return sortAsc ? 1 : -1;
    return 0;
  });
}, [filteredReports, sortAsc]);

const totalPages = Math.max(
  1,
  Math.ceil(sortedReports.length / pageSize)
);

const pageItems = sortedReports.slice(
  (page - 1) * pageSize,
  page * pageSize
);
    function openReportModal(report) {
        setSelectedReport(report);
        setShowReportModal(true);
    }
    function closeReportModal() {
        setSelectedReport(null);
        setShowReportModal(false);
    }
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
                toast.warning("Interview not attended.");
            }
        } catch (err) {
            console.error(err);
            alert("Error loading interview report");
        }
    }
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-lg font-semibold animate-pulse">
                    Loading Reports...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Super Admin Reports</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Showing all company reports with company-name sorting.
                    </p>
                </div>

                <button
                    onClick={() => router.push("/superadmin")}
                    className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg transition"
                >
                    ← Back to Dashboard
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-3 mb-6 items-start md:items-center">
                <input
                    type="text"
                    placeholder="Search by company, email, or role"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-96 border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                    type="button"
                    onClick={() => setSortAsc((prev) => !prev)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
                >
                    Sort by Company {sortAsc ? "↑" : "↓"}
                </button>
            </div>

            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-200 text-gray-700 uppercase">
                            <tr>
                                <th className="px-6 py-4 text-left">Company</th>
                                <th className="px-6 py-4 text-left">Email</th>
                                <th className="px-6 py-4 text-left">Role</th>
                                <th className="px-6 py-4 text-left">Date</th>
                                <th className="px-6 py-4 text-left">Report</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedReports.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-gray-500">
                                        No reports found.
                                    </td>
                                </tr>
                            ) : (
                                pageItems.map((report) => (
                                    <tr
                                        key={report._id}
                                        className="border-b hover:bg-gray-50 transition"
                                    >
                                        <td className="px-6 py-4 font-semibold">{report.companyName}</td>
                                        <td className="px-6 py-4">{report.email}</td>
                                        <td className="px-6 py-4">{report.role}</td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => openReportModal(report)} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">Assessment</button>
                                                <button
                                                    onClick={() => openInterviewReport(report.email, report.role)}
                                                    className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                                                >
                                                    Interview
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
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
                            {/* <div>
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
                </div> */}
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
                                {/* <button
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
                  </button> */}

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

    );
}
