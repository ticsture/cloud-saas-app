// src/routes/attachmentRoutes.ts

import { Router, Response } from "express";
import multer from "multer";
import {
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from "../config/prisma";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { s3Client } from "../config/s3";

const router = Router();

// Store files in memory before sending to S3
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// ====================================================
// POST /attachments  → upload file for a task
// ====================================================
router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const file = req.file;
      const { taskId } = req.body;

      if (!file) {
        return res.status(400).json({ message: "File is required" });
      }

      if (!taskId) {
        return res.status(400).json({ message: "taskId is required" });
      }

      // Check task + workspace membership
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          project: {
            include: {
              workspace: {
                include: { members: true },
              },
            },
          },
        },
      });

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const isMember = task.project.workspace.members.some(
        (m) => m.userId === userId
      );

      if (!isMember) {
        return res.status(403).json({
          message: "You do not have access to this task",
        });
      }

      const bucketName = process.env.AWS_S3_BUCKET_NAME;
      if (!bucketName) {
        return res
          .status(500)
          .json({ message: "S3 bucket name is not configured" });
      }

      const fileExtension = file.originalname.split(".").pop();
      const key = `attachments/${taskId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExtension}`;

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(putCommand);

      const attachment = await prisma.attachment.create({
        data: {
          fileName: file.originalname,
          fileUrl: key,
          taskId,
        },
      });

      return res.status(201).json({
        message: "File uploaded successfully",
        attachment,
      });
    } catch (error) {
      console.error("Error uploading attachment:", error);
      return res.status(500).json({
        message: "Failed to upload attachment",
      });
    }
  }
);

// ====================================================
// GET /attachments/task/:taskId → list attachments for a task
// ====================================================
router.get(
  "/task/:taskId",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { taskId } = req.params;

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          project: {
            include: {
              workspace: {
                include: { members: true },
              },
            },
          },
        },
      });

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const isMember = task.project.workspace.members.some(
        (m) => m.userId === userId
      );

      if (!isMember) {
        return res.status(403).json({
          message: "You do not have access to this task",
        });
      }

      const attachments = await prisma.attachment.findMany({
        where: { taskId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fileName: true,
          createdAt: true,
        },
      });

      return res.json({ attachments });
    } catch (error) {
      console.error("Error listing attachments:", error);
      return res.status(500).json({
        message: "Failed to list attachments",
      });
    }
  }
);

// ====================================================
// GET /attachments/:id/download → signed URL for download
// ====================================================
router.get(
  "/:id/download",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      const attachment = await prisma.attachment.findUnique({
        where: { id },
        include: {
          task: {
            include: {
              project: {
                include: {
                  workspace: {
                    include: { members: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      const isMember = attachment.task.project.workspace.members.some(
        (m) => m.userId === userId
      );

      if (!isMember) {
        return res.status(403).json({
          message: "Forbidden",
        });
      }

      const bucketName = process.env.AWS_S3_BUCKET_NAME!;
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: attachment.fileUrl,
      });

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 300, // 5 minutes
      });

      return res.json({
        downloadUrl: signedUrl,
      });
    } catch (error) {
      console.error("Error generating signed URL:", error);
      return res.status(500).json({
        message: "Failed to generate download URL",
      });
    }
  }
);

export default router;
