import { Request, Response } from "express";
import { db, bucket } from "../config/firebase";
import { AIService } from "../services/ai";
import { Logger } from "../utils/logger";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export class AnalysisController {
  static async analyzeResume(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { targetRole } = req.body;
      if (!targetRole) {
        return res.status(400).json({ error: "Target role is required" });
      }

      Logger.info(`Starting resume analysis for user ${req.user.uid}, target role: ${targetRole}`);

      let text = "";
      if (req.file.mimetype === "application/pdf") {
        const data = await pdfParse(req.file.buffer);
        text = data.text;
      } else if (
        req.file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        text = result.value;
      } else {
        return res.status(400).json({ error: "Unsupported file format" });
      }

      // AI Analysis
      const analysis = await AIService.analyzeSkills(text, targetRole);

      // Course Recommendations
      const courses = await AIService.getCourseRecommendations(analysis.missingSkills);

      // Roadmap Generation
      const roadmap = await AIService.generateRoadmap(analysis.missingSkills, targetRole);

      // Save to Firestore
      const analysisRef = db.collection("users").doc(req.user.uid).collection("analyses").doc();
      await analysisRef.set({
        targetRole,
        analysis,
        courses,
        roadmap,
        createdAt: new Date().toISOString(),
      });

      // Upload to Storage (optional, but requested "secure file handling")
      const blob = bucket.file(`resumes/${req.user.uid}/${analysisRef.id}-${req.file.originalname}`);
      await blob.save(req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: {
          uid: req.user.uid,
          analysisId: analysisRef.id,
        },
      });

      Logger.info(`Successfully analyzed resume for user ${req.user.uid}`);
      res.json({ id: analysisRef.id, analysis, courses, roadmap });
    } catch (error) {
      Logger.error(`Error analyzing resume for user ${req.user.uid}:`, error);
      res.status(500).json({ error: "Failed to analyze resume" });
    }
  }

  static async getAnalyses(req: any, res: Response) {
    try {
      const analysesDocs = await db.collection("users").doc(req.user.uid).collection("analyses").orderBy("createdAt", "desc").get();
      const analyses = analysesDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(analyses);
    } catch (error) {
      Logger.error(`Error getting analyses for user ${req.user.uid}:`, error);
      res.status(500).json({ error: "Failed to get analyses" });
    }
  }
}





