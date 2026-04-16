const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  description: { type: String, required: true },
  location: { type: String },
  duration: { type: String },
  stipend: { type: String },
  requiredSkills: [{ type: String }],
  tags: [{ type: String }],
  deadline: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Job", jobSchema);
