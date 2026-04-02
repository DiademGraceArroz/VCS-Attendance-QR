require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend — go up one level from src/ to find public/
app.use(express.static(path.join(__dirname, "../public")));

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/vcs_attendance",
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Student Schema
const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  grade: { type: String, required: true },
  address: { type: String },
  church: { type: String, required: true },
  vcsYear: { type: String, required: true },
  attendance: [{ type: Date }],
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

const Student = mongoose.model("Student", studentSchema);

// Routes

// Check if student exists
app.get("/api/students/:id", async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });
    if (student) {
      res.json({ exists: true, student });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register new student
app.post("/api/students", async (req, res) => {
  try {
    const {
      studentId,
      fullName,
      age,
      gender,
      grade,
      address,
      church,
      vcsYear,
    } = req.body;

    const student = new Student({
      studentId,
      fullName,
      age,
      gender,
      grade,
      address,
      church,
      vcsYear,
    });

    await student.save();
    res.status(201).json({ success: true, student });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark attendance
app.post("/api/students/:id/attendance", async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyMarked = student.attendance.some((date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    if (!alreadyMarked) {
      student.attendance.push(new Date());
      await student.save();
    }

    res.json({ success: true, alreadyMarked });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tags
app.put("/api/students/:id/tags", async (req, res) => {
  try {
    const { tag, action } = req.body;
    const student = await Student.findOne({ studentId: req.params.id });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (action === "add") {
      if (!student.tags.includes(tag)) {
        student.tags.push(tag);
      }
    } else {
      student.tags = student.tags.filter((t) => t !== tag);
    }

    await student.save();
    res.json({ success: true, tags: student.tags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all students
app.get("/api/students", async (req, res) => {
  try {
    const { vcsYear, limit = 100, skip = 0 } = req.query;
    const filter = vcsYear ? { vcsYear } : {};
    const students = await Student.find(filter)
      .limit(Number(limit))
      .skip(Number(skip));
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance report for specific date
app.get("/api/attendance/:date", async (req, res) => {
  try {
    const date = new Date(req.params.date);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const students = await Student.find({
      attendance: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback — serve index.html for any unknown route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
