import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function InvoicesPage() {
  const router = useRouter();

  const [invoices, setInvoices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/superadmin/invoices", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          router.push("/superadmin/login");
        } else {
          setInvoices(data.invoices);
          setFiltered(data.invoices);
        }
        setLoading(false);
      })
      .catch(() => router.push("/superadmin/login"));
  }, []);

  // 🔍 Search filter
  useEffect(() => {
    const result = invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.companyName.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, invoices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-lg font-semibold animate-pulse">
          Loading Invoices...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Invoice Management
        </h1>

        <button
          onClick={() => router.push("/superadmin")}
          className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg transition"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by invoice number or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-96 border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-200 text-gray-700 uppercase">
              <tr>
                <th className="px-6 py-4 text-left">Invoice No</th>
                <th className="px-6 py-4 text-left">Company</th>
                <th className="px-6 py-4 text-left">Subtotal</th>
                <th className="px-6 py-4 text-left">GST</th>
                <th className="px-6 py-4 text-left">Grand Total</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-8 text-gray-500"
                  >
                    No invoices found
                  </td>
                </tr>
              ) : (
                filtered.map((invoice) => (
                  <tr
                    key={invoice._id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 font-semibold">
                      {invoice.invoiceNumber}
                    </td>

                    <td className="px-6 py-4">
                      {invoice.companyName}
                    </td>

                    <td className="px-6 py-4">
                      ₹{invoice.subTotal}
                    </td>

                    <td className="px-6 py-4">
                      ₹{invoice.gstAmount}
                    </td>

                    <td className="px-6 py-4 font-semibold text-gray-800">
                      ₹{invoice.grandTotal}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {invoice.paymentStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {new Date(invoice.issuedAt).toLocaleDateString()}
                    </td>

                   <td className="px-6 py-4 space-x-2">

  

  <a
    href={`/api/superadmin/invoice/${invoice._id}`}
    target="_blank"
    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
  >
    Download
  </a>

</td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
