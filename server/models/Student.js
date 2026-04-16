const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resume: { type: String },
  major: { type: String },
  skills: [{ type: String }],
  preferences: {
    location: { type: String },
    duration: { type: String },
    stipend: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

studentSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

studentSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Student", studentSchema);
