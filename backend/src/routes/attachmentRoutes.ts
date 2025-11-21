// src/routes/attachmentRoutes.ts

import { Router, Response } from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import prisma from '../config/prisma';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { s3Client } from '../config/s3';

const router = Router();

// Store file in memory first (not on disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
});

// POST /attachments
// Fields:
// - file: the uploaded file
// - taskId: the task to attach this file to
router.post(
  '/',
  authMiddleware,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const file = req.file;
      const { taskId } = req.body;

      if (!file) {
        return res.status(400).json({ message: 'File is required' });
      }

      if (!taskId) {
        return res.status(400).json({ message: 'taskId is required' });
      }

      // 1) Check that the task exists and belongs to a workspace
      //    the user is a member of (security)
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
        return res.status(404).json({ message: 'Task not found' });
      }

      const isMember = task.project.workspace.members.some(
        (m) => m.userId === userId
      );

      if (!isMember) {
        return res
          .status(403)
          .json({ message: 'You do not have access to this task' });
      }

      // 2) Prepare S3 upload
      const bucketName = process.env.AWS_S3_BUCKET_NAME;
      if (!bucketName) {
        return res
          .status(500)
          .json({ message: 'S3 bucket name is not configured' });
      }

      // Make a unique key for the file in S3
      const fileExtension = file.originalname.split('.').pop();
      const key = `attachments/${taskId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExtension}`;

      // 3) Upload to S3
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(putCommand);

      // 4) Save attachment record in DB
      // For now we store the S3 key in fileUrl (later we can generate signed URLs)
      const attachment = await prisma.attachment.create({
        data: {
          fileName: file.originalname,
          fileUrl: key,
          taskId: taskId,
        },
      });

      return res.status(201).json({
        message: 'File uploaded successfully',
        attachment,
      });
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return res
        .status(500)
        .json({ message: 'Failed to upload attachment', error: String(error) });
    }
  }
);

export default router;
