const mongoose = require('mongoose');

const JobRoleSchema = new mongoose.Schema({
   companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobInfo',
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  questions: [
    {
      questionText: {
        type: String,
        required: true,
      },
      answer: {
        type: String,
        default: null,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      }
    }
  ],
}, { timestamps: true });

module.exports = mongoose.models.JobRole || mongoose.model('JobRole', JobRoleSchema);
