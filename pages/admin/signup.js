// import { useState } from "react";
// import { useRouter } from "next/router";

// export default function Signup() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [form, setForm] = useState({
//     companyName: "",
//     name: "",
//     email: "",
//     password: "",
//   });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const res = await fetch("/api/admin/signup", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(form),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         alert("Signup successful!");
//         return router.push("/admin/login");
//       } else {
//         alert(data.error || "Signup failed");
//       }
//     } catch (err) {
//       alert("Something went wrong. Please try again.");
//     } finally {
//       setLoading(false);
//     }

//     alert(data.error || "Signup failed");
//   };

//   return (
//     <div className="min-h-screen flex flex-col bg-gray-100">

//       {/* Center Content */}
//       <div className="flex flex-1 items-center justify-center p-4">
//         <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6">
//           <h2 className="text-2xl font-semibold mb-6 text-center">Signup</h2>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <input
//               name="companyName"
//               placeholder="Company Name"
//               onChange={handleChange}
//               className="w-full p-3 border rounded-lg"
//             />

//             <input
//               name="name"
//               placeholder="Your Name"
//               onChange={handleChange}
//               className="w-full p-3 border rounded-lg"
//             />

//             <input
//               name="email"
//               placeholder="Email"
//               type="email"
//               onChange={handleChange}
//               className="w-full p-3 border rounded-lg"
//             />

//             <input
//               name="password"
//               placeholder="Password"
//               type="password"
//               onChange={handleChange}
//               className="w-full p-3 border rounded-lg"
//             />

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
//             >
//               {loading ? "SignUp..." : "SignUp"}
//             </button>
//           </form>
//         </div>
//       </div>

//       {/* Footer Only Added */}
//       <footer className=" border-t">
//         <div className="max-w-6xl mx-auto px-6 py-6">

//           <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">

//             {/* Left Side - Contact */}
//             <div>
//               <p className="text-sm font-semibold text-gray-900">
//                 Contact Us
//               </p>
//               <a
//                 href="mailto:connect@mockmingle.in"
//                 className="text-sm text-indigo-600 hover:text-indigo-700 transition"
//               >
//                 connect@mockmingle.in
//               </a>
//             </div>

//             {/* Right Side - Logo + Powered By */}
//             <div className="flex flex-col items-center">

//               <img
//                 src="/MM_LOGO.png"
//                 alt="MockMingle Logo"
//                 className="h-8 mb-2 object-contain flex item-center"
//               />

//               <p className="text-xs text-gray-500">
//                 © {new Date().getFullYear()} Powered by{" "}
//                 <span className="font-semibold text-gray-700">
//                   MockMingle.in
//                 </span>
//               </p>

//             </div>

//           </div>

//         </div>
//       </footer>

//     </div>

//   );
// }
import { useState } from "react";
import { useRouter } from "next/router";

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    companyName: "",
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" }); // clear error while typing
  };

  // -------------------------
  // VALIDATION FUNCTION
  // -------------------------
  const validate = () => {
    let err = {};

    // Company Name
    if (!form.companyName.trim()) {
      err.companyName = "Company name is required";
    } else if (form.companyName.trim().length < 2) {
      err.companyName = "Company name must be at least 2 characters";
    }

    // Full Name
    if (!form.name.trim()) {
      err.name = "Full name is required";
    } else if (!/^[A-Za-z ]+$/.test(form.name.trim())) {
      err.name = "Name must contain only alphabets";
    } else if (form.name.trim().length < 3) {
      err.name = "Name must be at least 3 characters";
    }

    // Email
    if (!form.email.trim()) {
      err.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      err.email = "Enter a valid email address";
    }

    // Password
    if (!form.password) {
      err.password = "Password is required";
    } else if (form.password.length < 6) {
      err.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[A-Z])/.test(form.password)) {
      err.password = "Password must contain at least one uppercase letter";
    } else if (!/(?=.*[0-9])/.test(form.password)) {
      err.password = "Password must contain at least one number";
    }

    return err;
  };

  // -------------------------
  // SUBMIT
  // -------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Signup successful!");
        router.push("/admin/login");
      } else {
        alert(data.error || "Signup failed");
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* Center Content */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 text-center">Signup</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Company Name */}
            <div>
              <input
                name="companyName"
                placeholder="Company Name"
                value={form.companyName}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg outline-none focus:ring-2 
                ${errors.companyName ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-400"}`}
              />
              {errors.companyName && (
                <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <input
                name="name"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg outline-none focus:ring-2 
                ${errors.name ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-400"}`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <input
                name="email"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg outline-none focus:ring-2 
                ${errors.email ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-400"}`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <input
                name="password"
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg outline-none focus:ring-2 
                ${errors.password ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-400"}`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col  items-center justify-between gap-6 text-center md:text-left">

         

          <div className="flex flex-col items-center">
            <img
              src="/MM_LOGO.png"
              alt="MockMingle Logo"
              className="h-8 mb-2 object-contain"
            />
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Powered by{" "}
              <span className="font-semibold text-gray-700">
                MockMingle.in
              </span>
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
