import mongoose from "mongoose";

const CompanyPaymentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    paymentProof: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      default: 1475,
    },

    creditsRemaining: {
      type: Number,
      default: 5,   // Initial credits after payment
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.CompanyPayment ||
  mongoose.model("CompanyPayment", CompanyPaymentSchema);
