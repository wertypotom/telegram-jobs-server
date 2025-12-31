import { envConfig } from '@config/env.config';
import { authenticate } from '@middlewares/auth.middleware';
import { Router } from 'express';
import multer from 'multer';
import path from 'path';

import { ResumeController } from './resume.controller';

const router = Router();
const resumeController = new ResumeController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, envConfig.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: envConfig.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
    }
  },
});

router.post('/upload', authenticate, upload.single('resume'), resumeController.uploadResume);

export default router;
