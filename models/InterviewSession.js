import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema(
  {
    section: String, // 'apti'|'technical'|'softskill'
    questionIndex: Number,
    response: mongoose.Schema.Types.Mixed,
    audioPath: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InterviewSessionSchema = new mongoose.Schema(
  {
    // ⭐ Important for multi-company
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    jobInfo: { type: mongoose.Schema.Types.ObjectId, ref: "JobInfo", required: true },
    slug: { type: String, required: true },

    candidate: {
      name: String,
      email: String,
      phone: String,
      appliedAt: { type: Date, default: Date.now },
    },

    generatedQuestions: {
      aptitude: [{ prompt: String, options: [String], correctOptionIndex: Number }],
      technical: [{ prompt: String, hint: String }],
      softskill: [{ prompt: String }],
    },

    answers: [AnswerSchema],

    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },

    reportGenerated: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.InterviewSession ||
  mongoose.model("InterviewSession", InterviewSessionSchema);
