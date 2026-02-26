import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function CompanyPayment() {
  const router = useRouter();

  useEffect(() => {
    // Removed automatic redirect to allow user choice
  }, []);

  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">

      {/* MAIN CONTENT */}
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">

          <div className="md:flex">
            {/* Left Info Bar */}
            <div className="md:w-1/3 bg-indigo-600 p-8 text-white">
              <h1 className="text-2xl font-bold mb-4">Payment Options</h1>
              <p className="text-indigo-100 text-sm mb-8">
                Choose the best plan for your recruitment needs. Get instant credits and start hiring.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">✓</div>
                  <span className="text-sm">Instant Credits</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">✓</div>
                  <span className="text-sm">GST Invoice</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">✓</div>
                  <span className="text-sm">Secure Payment</span>
                </div>
              </div>

              <div className="mt-12 text-center">
                <img src="/MM_LOGO.png" alt="Logo" className="h-8 mx-auto invert opacity-50" />
              </div>
            </div>

            {/* Right Choice Section */}
            <div className="md:w-2/3 p-8 sm:p-12">
              <h2 className="text-xl font-bold text-gray-800 mb-8">Select Your Package</h2>

              <div className="grid grid-cols-1 gap-6">

                {/* Option 1: One-time */}
                <div
                  onClick={() => window.location.href = "https://rzp.io/rzp/AEe6mkDs"}
                  className="group cursor-pointer border-2 border-gray-100 hover:border-indigo-500 rounded-xl p-6 transition-all bg-gray-50 hover:bg-white hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase">One-Time</span>
                    <span className="text-2xl font-bold text-gray-900">₹1,475</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Standard Credits</h3>
                  <p className="text-sm text-gray-500">Get 5 interview credits valid for any candidate assessment.</p>
                  <div className="mt-4 text-indigo-600 font-semibold group-hover:underline text-sm flex items-center gap-2">
                    Purchase Standard Link →
                  </div>
                </div>

                {/* Option 2: Subscription */}
                <div
                  onClick={() => window.location.href = "https://rzp.io/rzp/RZaj5esh"}
                  className="group cursor-pointer border-2 border-gray-100 hover:border-indigo-500 rounded-xl p-6 transition-all bg-gray-50 hover:bg-white hover:shadow-md relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white px-8 py-1 rotate-45 translate-x-10 translate-y-3 text-[10px] font-bold">RECURRING</div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">Subscription</span>
                    <span className="text-2xl font-bold text-gray-900">Subscribe</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">UPI Mandate Plan</h3>
                  <p className="text-sm text-gray-500">Setup a recurring subscription for seamless recruitment cycles.</p>
                  <div className="mt-4 text-indigo-600 font-semibold group-hover:underline text-sm flex items-center gap-2">
                    Subscribe with UPI Mandate →
                  </div>
                </div>

              </div>

              <p className="mt-8 text-center text-xs text-gray-400">
                You will be redirected to Razorpay's secure payment portal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-6 border-t bg-white">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center text-gray-400 text-xs">
          <span>© {new Date().getFullYear()} MockMingle.in</span>
          <span>Secured by Razorpay</span>
        </div>
      </footer>
    </div>
  );
}

