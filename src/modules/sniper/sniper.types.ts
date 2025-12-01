export interface TailorResumeRequest {
  jobId: string;
}

export interface TailoredResumeResponse {
  pdfUrl: string;
  docxUrl: string;
  telegramMessage: string;
  coverLetter: string;
}

export interface TailoredContent {
  summary: string;
  skills: string[];
  telegramMessage: string;
  coverLetter: string;
}
