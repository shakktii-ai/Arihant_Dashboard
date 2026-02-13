// pages/api/admin/signup.js

import dbConnect from "../../../lib/db";
import Company from "../../../models/company";
import Admin from "../../../models/admin";
import bcrypt from "bcryptjs";
import { signToken, setTokenCookie } from "../../../lib/auth";

export default async function handler(req, res) {
  try {
    await dbConnect();
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Database connection failed" });
  }

  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const { companyName, name, email, password } = req.body;

    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    // ✔ Normalize fields
    const companyNameClean = companyName.trim().toLowerCase();
    const lcEmail = email.trim().toLowerCase();

    // ✔ Basic email format validation
    if (!/^\S+@\S+\.\S+$/.test(lcEmail)) {
      return res.status(400).json({ ok: false, error: "Invalid email format" });
    }

    // ✔ Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: lcEmail });
    if (existingAdmin) {
      return res.status(400).json({ ok: false, error: "Admin with this email already exists" });
    }

    // ✔ Check if company exists
    const existingCompany = await Company.findOne({ name: companyNameClean });

    let company;

    if (existingCompany) {
      // OPTIONAL: Allow multiple admins under same company
      company = existingCompany;
    } else {
      // Create company if not exists
      company = await Company.create({ name: companyNameClean });
    }

    // ✔ Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // ✔ Create admin under company
    const admin = await Admin.create({
      name,
      email: lcEmail,
      passwordHash,
      companyId: company._id,
    });

    // ✔ Create JWT token
    const token = signToken({
      adminId: admin._id,
      companyId: company._id,
      email: admin.email,
    });

    // ✔ Set token cookie
    setTokenCookie(res, token);

    return res.status(201).json({
      ok: true,
      message: "Signup successful",
      admin: { id: admin._id, email: admin.email, name: admin.name },
      company: { id: company._id, name: company.name },
    });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ ok: false, error: "Signup failed" });
  }
}
