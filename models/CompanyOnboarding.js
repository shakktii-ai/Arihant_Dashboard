import mongoose from "mongoose";

const CompanyOnboardingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true, // one onboarding per company
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    industry: {
      type: String,
      required: true,
      trim: true,
    },

    companyType: {
      type: String,
      enum: ["Startup", "MNC", "PSU", "Family Business"],
      required: true,
    },

    registeredAddress: {
      type: String,
      required: true,
      trim: true,
    },

    gstNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      validate: {
        validator: function (v) {
          // GST format: 22AAAAA0000A1Z5 (15 characters)
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        },
        message: 'Invalid GST number format. Format: 22AAAAA0000A1Z5'
      }
    },

    employeeSize: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    hierarchyLevel: {
      type: String,
      enum: ["Flat", "Moderate", "Strict"],
      required: true,
    },

    communicationStyle: {
      type: String,
      enum: [
        "formal",
        "informal",
        "email-heavy",
        "chat-based",
        "meeting-driven",
      ],
      required: true,
    },

    collaborationStyle: {
      type: String,
      enum: ["cross-functional", "siloed", "top-down", "organic"],
      default: "",
    },

    feedbackCulture: {
      type: String,
      enum: ["frequent", "rare", "safe", "avoided", "hierarchical"],
      required: true,
    },
    targetMarket: {
      type: String,
      required: true,
      trim: true,
    },

    sampleClients: {
      type: [String],
      default: [],
    },

    workPressure: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    onboardingChallenges: {
      type: String,
      default: "",
      trim: true,
    },
    paymentProof: {
      type: String, // URL/Path to the screenshot
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    creditsRemaining: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: true, // saved only after final step
    },
    isActive: {
      type: Boolean,
      default: true,
    },

  },
  {
    timestamps: true,
  }
);
export default mongoose.models.CompanyOnboarding ||
  mongoose.model("CompanyOnboarding", CompanyOnboardingSchema);
