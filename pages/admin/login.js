import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // VERY IMPORTANT for cookies
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.ok) {
        if (!data.company.onboardingCompleted) {
          router.push("/admin/company/onboarding");
        } else {
          router.push("/admin");
        }
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

  {/* CENTER CONTENT */}
  <div className="flex flex-1 items-center justify-center p-4">
    <div className="w-full max-w-sm bg-white shadow-lg rounded-xl p-6">
      <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          name="password"
          placeholder="Password"
          type="password"
          onChange={handleChange}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? "Login..." : "Login"}
        </button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link href="/admin/signup" className="text-blue-600 hover:underline">
              SignUp
            </Link>
          </p>
        </div>
      </form>
    </div>
  </div>

  {/* FOOTER */}
  <footer className=" border-t">
        <div className="max-w-6xl mx-auto px-6 py-6">

          <div className="flex flex-col  items-center justify-between gap-6 text-center md:text-left">

           

            {/* Right Side - Logo + Powered By */}
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
