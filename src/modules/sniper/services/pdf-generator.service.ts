import PDFDocument from 'pdfkit';
import { promises as fs } from 'fs';
import path from 'path';
import { envConfig } from '@config/env.config';
import { Logger } from '@utils/logger';

export class PdfGeneratorService {
  async generateResume(content: {
    name: string;
    email: string;
    summary: string;
    skills: string[];
    experience: string;
  }): Promise<string> {
    const fileName = `resume-${Date.now()}.pdf`;
    const filePath = path.join(envConfig.tempDir, fileName);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = require('fs').createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(24).text(content.name, { align: 'center' });
      doc.fontSize(12).text(content.email, { align: 'center' });
      doc.moveDown();

      // Summary
      doc.fontSize(16).text('Professional Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(content.summary);
      doc.moveDown();

      // Skills
      doc.fontSize(16).text('Key Skills', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(content.skills.join(' • '));
      doc.moveDown();

      // Experience
      doc.fontSize(16).text('Experience', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(content.experience);

      doc.end();

      stream.on('finish', () => {
        Logger.info('PDF resume generated', { filePath });
        resolve(filePath);
      });

      stream.on('error', (error: Error) => {
        Logger.error('Failed to generate PDF:', error);
        reject(error);
      });
    });
  }
}
