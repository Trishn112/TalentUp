import { Router } from "express";
import { UserController } from "../controllers/user.js";
import { AnalysisController } from "../controllers/analysis.js";
import { InterviewController } from "../controllers/interview.js";
import { authenticate } from "../middleware/auth.js";
import multer from "multer";
import rateLimit from "express-rate-limit";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 analysis requests per hour
  message: "Analysis limit reached, please try again after an hour",
});

// Public Routes (if any)
router.get("/health", (req, res) => res.json({ 
  status: "ok", 
  timestamp: new Date().toISOString(),
  env: process.env.NODE_ENV || "development"
}));

// Protected Routes
router.use(apiLimiter);
router.use(authenticate);

// User Routes
router.get("/user/profile", UserController.getProfile);
router.post("/user/profile", UserController.updateProfile);
router.get("/user/progress", UserController.getProgress);

// Analysis Routes
router.post("/analysis/resume", analysisLimiter, upload.single("resume"), AnalysisController.analyzeResume);
router.get("/analysis/history", AnalysisController.getAnalyses);

// Interview Routes
router.post("/interview/start", InterviewController.startSession);
router.post("/interview/submit", InterviewController.submitResponse);
router.post("/interview/complete", InterviewController.completeSession);
router.get("/interview/history", InterviewController.getInterviews);

export default router;
