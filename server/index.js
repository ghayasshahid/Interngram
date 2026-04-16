require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: "Too many attempts, please try again in 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

const mongoose = require("mongoose");
const Job = require("./models/Job");
const Company = require("./models/Company");
const Student = require("./models/Student");
const Application = require("./models/Application");
const Skill = require("./models/Skill");
const Notification = require("./models/Notification");
const { authenticateToken, JWT_SECRET } = require("./middleware/auth");

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Server working!");
});

// Company Authentication Routes
app.post("/api/company/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !companyName?.trim())
      return res.status(400).json({ message: "Name, email, password and company name are required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ message: "Company already exists" });
    }
    const company = new Company({ name, email, password, companyName });
    await company.save();
    const token = jwt.sign({ id: company._id, type: "company" }, JWT_SECRET);
    res.json({ token, company: { id: company._id, name: company.name, email: company.email, companyName: company.companyName } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.post("/api/company/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password)
      return res.status(400).json({ message: "Email and password are required" });
    const company = await Company.findOne({ email });
    if (!company || !(await company.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: company._id, type: "company" }, JWT_SECRET);
    res.json({ token, company: { id: company._id, name: company.name, email: company.email, companyName: company.companyName } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Student Authentication Routes
app.post("/api/student/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ message: "Name, email and password are required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: "Student already exists" });
    }
    const student = new Student({ name, email, password });
    await student.save();
    const token = jwt.sign({ id: student._id, type: "student" }, JWT_SECRET);
    res.json({ token, student: { id: student._id, name: student.name, email: student.email, major: student.major, skills: student.skills, preferences: student.preferences } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.post("/api/student/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password)
      return res.status(400).json({ message: "Email and password are required" });
    const student = await Student.findOne({ email });
    if (!student || !(await student.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: student._id, type: "student" }, JWT_SECRET);
    res.json({ token, student: { id: student._id, name: student.name, email: student.email, major: student.major, skills: student.skills, preferences: student.preferences } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Job Routes
app.get("/api/jobs", async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;
    const total = await Job.countDocuments();
    const jobs  = await Job.find().populate("companyId", "companyName name email").skip(skip).limit(limit);
    res.json({ jobs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("companyId", "companyName name email");
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/company/jobs", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "company") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const jobs = await Job.find({ companyId: req.user.id });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/api/jobs/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "company") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const job = await Job.findOne({ _id: req.params.id, companyId: req.user.id });
    if (!job) return res.status(404).json({ message: "Job not found" });
    const { title, description, location, duration, stipend, requiredSkills, tags, deadline } = req.body;
    if (title)          job.title = title;
    if (description)    job.description = description;
    if (location)       job.location = location;
    if (duration)       job.duration = duration;
    if (stipend)        job.stipend = stipend;
    if (requiredSkills) job.requiredSkills = requiredSkills;
    if (tags)           job.tags = tags;
    if (deadline)       job.deadline = deadline;
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/jobs/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "company") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const job = await Job.findOneAndDelete({ _id: req.params.id, companyId: req.user.id });
    if (!job) return res.status(404).json({ message: "Job not found" });
    await Application.deleteMany({ jobId: req.params.id });
    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Application Routes
app.post("/api/applications", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "student") {
      return res.status(403).json({ message: "Only students can apply" });
    }
    const { jobId, coverLetter } = req.body;
    const existingApplication = await Application.findOne({ studentId: req.user.id, jobId });
    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }
    const application = new Application({ studentId: req.user.id, jobId, coverLetter });
    await application.save();
    const populated = await Application.findById(application._id)
      .populate("studentId", "name email")
      .populate("jobId", "title company");
    res.json(populated);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.get("/api/student/applications", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "student") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const applications = await Application.find({ studentId: req.user.id })
      .populate("jobId", "title company description location duration stipend");
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/company/applications/:jobId", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "company") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const job = await Job.findById(req.params.jobId);
    if (!job || job.companyId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate("studentId", "name email resume");
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/api/applications/:id/status", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "company") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const { status, interviewDate, offerDetails } = req.body;
    const application = await Application.findById(req.params.id).populate("jobId");
    if (!application || application.jobId.companyId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    application.status = status;
    if (interviewDate) application.interviewDate = interviewDate;
    if (offerDetails) application.offerDetails = offerDetails;
    application.updatedAt = new Date();
    await application.save();
    
    // Create notification for student
    await Notification.create({
      userId: application.studentId,
      userType: "student",
      type: "application_update",
      title: "Application Status Updated",
      message: `Your application for ${application.jobId.title} has been updated to: ${status}`,
      link: `/student/dashboard`
    });
    
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Recommendations API
app.get("/api/recommendations", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "student") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const student = await Student.findById(req.user.id);
    const allJobs = await Job.find().populate("companyId", "companyName");
    const studentApplications = await Application.find({ studentId: req.user.id });
    const appliedJobIds = studentApplications.map(app => app.jobId.toString());
    
    // Filter out already applied jobs
    const availableJobs = allJobs.filter(job => !appliedJobIds.includes(job._id.toString()));
    
    // Score jobs based on student skills, major, and preferences
    const scoredJobs = availableJobs.map(job => {
      let score = 0;
      
      // Match skills
      if (student.skills && job.requiredSkills) {
        const matchingSkills = student.skills.filter(skill => 
          job.requiredSkills.some(required => 
            required.toLowerCase().includes(skill.toLowerCase()) || 
            skill.toLowerCase().includes(required.toLowerCase())
          )
        );
        score += matchingSkills.length * 10;
      }
      
      // Match major (if job tags include major-related terms)
      if (student.major && job.tags) {
        const majorMatch = job.tags.some(tag => 
          tag.toLowerCase().includes(student.major.toLowerCase()) ||
          student.major.toLowerCase().includes(tag.toLowerCase())
        );
        if (majorMatch) score += 15;
      }
      
      // Match location preference
      if (student.preferences?.location && job.location) {
        if (job.location.toLowerCase().includes(student.preferences.location.toLowerCase())) {
          score += 5;
        }
      }
      
      return { job, score };
    });
    
    // Sort by score and return top 10
    const recommendations = scoredJobs
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.job);
    
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Student Profile Update (for skills, major, preferences)
app.patch("/api/student/profile", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "student") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const { skills, major, preferences } = req.body;
    const student = await Student.findById(req.user.id);
    if (skills) student.skills = skills;
    if (major) student.major = major;
    if (preferences) student.preferences = { ...student.preferences, ...preferences };
    await student.save();
    res.json({ id: student._id, name: student.name, email: student.email, major: student.major, skills: student.skills, preferences: student.preferences });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Skill Tracking APIs
app.get("/api/skills", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "student") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const skills = await Skill.find({ studentId: req.user.id });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/skills", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "student") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const { skillName, proficiency } = req.body;
    const existingSkill = await Skill.findOne({ studentId: req.user.id, skillName });
    if (existingSkill) {
      return res.status(400).json({ message: "Skill already exists" });
    }
    const skill = new Skill({ studentId: req.user.id, skillName, proficiency });
    await skill.save();
    res.json(skill);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/api/skills/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "student") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const { proficiency, isCompleted, testScore } = req.body;
    const skill = await Skill.findOne({ _id: req.params.id, studentId: req.user.id });
    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }
    if (proficiency) skill.proficiency = proficiency;
    if (isCompleted !== undefined) {
      skill.isCompleted = isCompleted;
      if (isCompleted) skill.completedAt = new Date();
    }
    if (testScore !== undefined) skill.testScore = testScore;
    await skill.save();
    res.json(skill);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/skills/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "student") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const skill = await Skill.findOneAndDelete({ _id: req.params.id, studentId: req.user.id });
    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }
    res.json({ message: "Skill deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Notifications API
app.get("/api/notifications", authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.user.id, 
      userType: req.user.type 
    }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/api/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Analytics API
app.get("/api/analytics/jobs/:jobId", authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    const applications = await Application.find({ jobId: req.params.jobId });
    const totalApplications = applications.length;
    const acceptedCount = applications.filter(app => app.status === "accepted").length;
    const pendingCount = applications.filter(app => app.status === "pending" || app.status === "reviewing").length;
    const interviewCount = applications.filter(app => app.status === "interview_scheduled").length;
    const offerCount = applications.filter(app => app.status === "offer_received").length;
    
    // Get top skills from applicants
    const students = await Student.find({ 
      _id: { $in: applications.map(app => app.studentId) } 
    });
    const allSkills = students.flatMap(s => s.skills || []);
    const skillCounts = {};
    allSkills.forEach(skill => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }));
    
    res.json({
      job: {
        title: job.title,
        company: job.company,
        requiredSkills: job.requiredSkills
      },
      stats: {
        totalApplications,
        acceptedCount,
        pendingCount,
        interviewCount,
        offerCount,
        acceptanceRate: totalApplications > 0 ? ((acceptedCount / totalApplications) * 100).toFixed(1) : 0
      },
      topSkills
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/analytics/student", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "student") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const applications = await Application.find({ studentId: req.user.id })
      .populate("jobId", "title company requiredSkills");
    
    const statusCounts = {
      pending: 0,
      reviewing: 0,
      interview_scheduled: 0,
      offer_received: 0,
      accepted: 0,
      rejected: 0
    };
    
    applications.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });
    
    // Get all required skills from applied jobs
    const allRequiredSkills = applications.flatMap(app => 
      app.jobId?.requiredSkills || []
    );
    const skillFrequency = {};
    allRequiredSkills.forEach(skill => {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    });
    const topRequiredSkills = Object.entries(skillFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));
    
    res.json({
      totalApplications: applications.length,
      statusCounts,
      topRequiredSkills,
      successRate: applications.length > 0 
        ? ((statusCounts.accepted / applications.length) * 100).toFixed(1) 
        : 0
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create notification when new job is posted
app.post("/api/jobs", authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== "company") {
      return res.status(403).json({ message: "Only companies can post jobs" });
    }
    const { title, company, description, location, duration, stipend, requiredSkills, tags, deadline } = req.body;
    const companyDoc = await Company.findById(req.user.id);
    const job = new Job({ 
      title, 
      company: company || companyDoc.companyName, 
      companyId: req.user.id,
      description, 
      location, 
      duration, 
      stipend,
      requiredSkills: requiredSkills || [],
      tags: tags || [],
      deadline
    });
    await job.save();
    
    // Notify all students about new internship
    const students = await Student.find();
    const notifications = students.map(student => ({
      userId: student._id,
      userType: "student",
      type: "new_internship",
      title: "New Internship Available",
      message: `${job.company} posted a new internship: ${job.title}`,
      link: `/student/dashboard`
    }));
    await Notification.insertMany(notifications);
    
    res.json(job);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
    