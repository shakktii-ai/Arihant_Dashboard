import { useState } from "react";
import { useRouter } from "next/router";

export default function CompanyPayment() {
  const router = useRouter();
  const [paymentProof, setPaymentProof] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!paymentProof) {
      alert("Payment proof required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/company/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paymentProof }),
      });

      const data = await res.json();

      if (data.ok) {
        router.push("/admin");
      } else {
        alert("Payment failed");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-gray-100">

      {/* MAIN CONTENT */}
      <div className="flex-grow flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-6 sm:p-10">

          {/* HEADER */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900">
              Complete Your Payment
            </h1>
            <p className="text-gray-500 mt-2">
              Secure your interview credits to start hiring
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">

            {/* LEFT SIDE - PACKAGE DETAILS */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-indigo-900 mb-4">
                Interview Credit Package
              </h2>

              <div className="space-y-3 text-sm text-indigo-800">
                <div className="flex justify-between">
                  <span>5 Credits (₹250 / credit)</span>
                  <span>₹1,250</span>
                </div>
                <div className="flex justify-between border-b border-indigo-200 pb-3">
                  <span>GST (18%)</span>
                  <span>₹225</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2">
                  <span>Total</span>
                  <span>₹1,475</span>
                </div>
              </div>

              <div className="mt-6 bg-white p-4 rounded-xl border text-sm text-gray-600">
                <p className="font-medium mb-2 text-gray-800">How to Pay:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Scan the QR code</li>
                  <li>Pay exactly ₹1,475</li>
                  <li>Take payment screenshot</li>
                  <li>Upload below to confirm</li>
                </ol>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex flex-col items-center">

              <div className="bg-white border rounded-2xl shadow-md p-4 mb-6 hover:shadow-lg transition">
                <img
                  src="/payment-qr.png"
                  alt="Payment QR"
                  className="w-52 h-52 object-contain"
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  Scan to Pay ₹1,475
                </p>
              </div>

              {/* Upload Section */}
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Payment Screenshot *
                </label>

                <div
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition
                    ${paymentProof
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-indigo-400 bg-gray-50"
                    }`}
                >
                  {!paymentProof ? (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        Drag & drop or click to upload
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="text-sm"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setPaymentProof(reader.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </>
                  ) : (
                    <div className="relative w-full flex justify-center">
                      <img
                        src={paymentProof}
                        alt="Preview"
                        className="max-h-52 rounded-lg shadow-md"
                      />
                      <button
                        onClick={() => setPaymentProof("")}
                        className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !paymentProof}
                className={`mt-8 w-full py-3 rounded-xl font-semibold text-white transition
                  ${loading || !paymentProof
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-md"
                  }`}
              >
                {loading ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className=" ">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-8 text-center md:text-left">

            

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
