import { useState } from "react";
import { useRouter } from "next/router";

export default function Signup() {
  const router = useRouter();

  const [form, setForm] = useState({
    companyName: "",
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/admin/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Signup successful!");
      return router.push("/admin/login");
    }

    alert(data.error || "Signup failed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-6 text-center">Signup</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="companyName"
            placeholder="Company Name"
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />

          <input
            name="name"
            placeholder="Your Name"
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />

          <input
            name="email"
            placeholder="Email"
            type="email"
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />

          <input
            name="password"
            placeholder="Password"
            type="password"
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
          >
            Signup
          </button>
        </form>
      </div>
    </div>
  );
}
