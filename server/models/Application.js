const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  coverLetter: { type: String },
  status: { 
    type: String, 
    enum: ["pending", "reviewing", "interview_scheduled", "offer_received", "accepted", "rejected"], 
    default: "pending" 
  },
  interviewDate: { type: Date },
  offerDetails: { type: String },
  appliedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Application", applicationSchema);
