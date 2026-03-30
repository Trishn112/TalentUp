import { Request, Response } from "express";
import { db } from "../config/firebase";
import { AIService } from "../services/ai";
import { Logger } from "../utils/logger";

export class InterviewController {
  static async startSession(req: any, res: Response) {
    try {
      const { role, level } = req.body;
      if (!role || !level) {
        return res.status(400).json({ error: "Role and level are required" });
      }

      Logger.info(`Starting interview session for user ${req.user.uid}, role: ${role}, level: ${level}`);

      const questions = await AIService.generateMockQuestions(role, level);
      const sessionRef = db.collection("users").doc(req.user.uid).collection("interviews").doc();
      await sessionRef.set({
        role,
        level,
        questions,
        status: "in-progress",
        createdAt: new Date().toISOString(),
      });

      res.json({ id: sessionRef.id, questions });
    } catch (error) {
      Logger.error(`Error starting interview session for user ${req.user.uid}:`, error);
      res.status(500).json({ error: "Failed to start interview session" });
    }
  }

  static async submitResponse(req: any, res: Response) {
    try {
      const { sessionId, questionIndex, userResponse } = req.body;
      if (!sessionId || questionIndex === undefined || !userResponse) {
        return res.status(400).json({ error: "Session ID, question index, and user response are required" });
      }

      Logger.info(`Submitting interview response for user ${req.user.uid}, session: ${sessionId}, question: ${questionIndex}`);

      const sessionDoc = await db.collection("users").doc(req.user.uid).collection("interviews").doc(sessionId).get();
      if (!sessionDoc.exists) {
        return res.status(404).json({ error: "Interview session not found" });
      }

      const sessionData = sessionDoc.data();
      const question = sessionData.questions[questionIndex].question;

      // AI Evaluation
      const evaluation = await AIService.evaluateResponse(question, userResponse);

      // Save response and evaluation
      const responses = sessionData.responses || [];
      responses[questionIndex] = {
        question,
        userResponse,
        evaluation,
        submittedAt: new Date().toISOString(),
      };

      await db.collection("users").doc(req.user.uid).collection("interviews").doc(sessionId).update({
        responses,
        updatedAt: new Date().toISOString(),
      });

      res.json({ evaluation });
    } catch (error) {
      Logger.error(`Error submitting interview response for user ${req.user.uid}:`, error);
      res.status(500).json({ error: "Failed to submit interview response" });
    }
  }

  static async completeSession(req: any, res: Response) {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }

      const sessionDoc = await db.collection("users").doc(req.user.uid).collection("interviews").doc(sessionId).get();
      if (!sessionDoc.exists) {
        return res.status(404).json({ error: "Interview session not found" });
      }

      const sessionData = sessionDoc.data();
      const responses = sessionData.responses || [];
      const averageScore = responses.reduce((acc: number, curr: any) => acc + curr.evaluation.score, 0) / responses.length;

      await db.collection("users").doc(req.user.uid).collection("interviews").doc(sessionId).update({
        status: "completed",
        averageScore,
        completedAt: new Date().toISOString(),
      });

      Logger.info(`Interview session completed for user ${req.user.uid}, session: ${sessionId}`);
      res.json({ message: "Interview session completed", averageScore });
    } catch (error) {
      Logger.error(`Error completing interview session for user ${req.user.uid}:`, error);
      res.status(500).json({ error: "Failed to complete interview session" });
    }
  }

  static async getInterviews(req: any, res: Response) {
    try {
      const interviewsDocs = await db.collection("users").doc(req.user.uid).collection("interviews").orderBy("createdAt", "desc").get();
      const interviews = interviewsDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(interviews);
    } catch (error) {
      Logger.error(`Error getting interviews for user ${req.user.uid}:`, error);
      res.status(500).json({ error: "Failed to get interviews" });
    }
  }
}
