import { InternalServerError } from '@utils/errors';
import { Logger } from '@utils/logger';
import { promises as fs } from 'fs';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export class FileExtractorService {
  async extractText(filePath: string, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf') {
        return await this.extractFromPdf(filePath);
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        return await this.extractFromDocx(filePath);
      } else {
        throw new InternalServerError('Unsupported file type');
      }
    } catch (error) {
      Logger.error('Failed to extract text from file:', error);
      throw new InternalServerError('Failed to extract text from resume');
    }
  }

  private async extractFromPdf(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  private async extractFromDocx(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
}
