import { Request, Response } from "express";
import { db, auth } from "../config/firebase";
import { Logger } from "../utils/logger";

export class UserController {
  static async getProfile(req: any, res: Response) {
    try {
      const userDoc = await db.collection("users").doc(req.user.uid).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(userDoc.data());
    } catch (error) {
      Logger.error(`Error getting profile for user ${req.user.uid}:`, error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  }

  static async updateProfile(req: any, res: Response) {
    try {
      const { name, targetRole, skills } = req.body;
      await db.collection("users").doc(req.user.uid).set({
        name,
        targetRole,
        skills,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      Logger.info(`Profile updated for user ${req.user.uid}`);
      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      Logger.error(`Error updating profile for user ${req.user.uid}:`, error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }

  static async getProgress(req: any, res: Response) {
    try {
      const progressDocs = await db.collection("users").doc(req.user.uid).collection("progress").get();
      const progress = progressDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(progress);
    } catch (error) {
      Logger.error(`Error getting progress for user ${req.user.uid}:`, error);
      res.status(500).json({ error: "Failed to get progress" });
    }
  }
}
