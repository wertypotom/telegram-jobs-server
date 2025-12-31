import { envConfig } from '@config/env.config';
import { Logger } from '@utils/logger';
import { Document, HeadingLevel, Packer, Paragraph } from 'docx';
import { promises as fs } from 'fs';
import path from 'path';

export class DocxGeneratorService {
  async generateResume(content: {
    name: string;
    email: string;
    summary: string;
    skills: string[];
    experience: string;
  }): Promise<string> {
    const fileName = `resume-${Date.now()}.docx`;
    const filePath = path.join(envConfig.tempDir, fileName);

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: content.name,
              heading: HeadingLevel.HEADING_1,
              alignment: 'center' as any,
            }),
            new Paragraph({
              text: content.email,
              alignment: 'center' as any,
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: 'Professional Summary',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: content.summary }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: 'Key Skills',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: content.skills.join(' • ') }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: 'Experience',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: content.experience }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filePath, buffer);

    Logger.info('DOCX resume generated', { filePath });
    return filePath;
  }
}
