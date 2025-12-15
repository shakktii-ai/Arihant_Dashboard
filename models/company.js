import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  domain: { type: String }, // optional
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Company || mongoose.model("Company", CompanySchema);
