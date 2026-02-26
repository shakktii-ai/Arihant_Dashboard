import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    companyName: String,
    gstNumber: String,
    billingAddress: String,

    items: [
      {
        description: String,
        quantity: Number,
        unitPrice: Number,
        total: Number,
      },
    ],

    subTotal: Number,
    gstRate: Number,
    gstAmount: Number,
    discountAmount: { type: Number, default: 0 },
    grandTotal: Number,

    paymentStatus: {
      type: String,
      enum: ["paid", "pending"],
      default: "paid",
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Invoice ||
  mongoose.model("Invoice", InvoiceSchema);
