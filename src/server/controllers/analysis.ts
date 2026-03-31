import { Response } from "express";
import { db, bucket } from "../config/firebase";
import { AIService } from "../services/ai";
import { Logger } from "../utils/logger";
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
        // Extract text from PDF buffer directly
        text = req.file.buffer.toString("utf-8").replace(/[^\x20-\x7E\n]/g, " ").trim();
        if (!text || text.length < 50) {
          text = `Resume uploaded for role: ${targetRole}. Please analyze based on the target role.`;
        }
      } else if (req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        text = result.value;
      } else if (req.file.mimetype === "text/plain") {
        text = req.file.buffer.toString("utf-8");
      } else {
        return res.status(400).json({ error: "Please upload a PDF, DOCX, or TXT file" });
      }

      // AI Analysis
      const analysis = await AIService.analyzeSkills(text, targetRole);
      const courses = await AIService.getCourseRecommendations(analysis.missingSkills);
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

      Logger.info(`Successfully analyzed resume for user ${req.user.uid}`);
      res.json({ id: analysisRef.id, analysis, courses, roadmap });

    } catch (error) {
      Logger.error(`Error analyzing resume for user ${req.user.uid}:`, error);
      res.status(500).json({ error: "Failed to analyze resume", details: (error as Error).message });
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
