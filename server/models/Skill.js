const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  skillName: { type: String, required: true },
  proficiency: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  isCompleted: { type: Boolean, default: false },
  testScore: { type: Number, min: 0, max: 100 },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Skill", skillSchema);
