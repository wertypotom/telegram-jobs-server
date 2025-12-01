export interface SendCodeRequest {
  phoneNumber: string;
}

export interface SendCodeResponse {
  phoneCodeHash: string;
  message: string;
}

export interface VerifyCodeRequest {
  phoneNumber: string;
  code: string;
  password?: string;
}

export interface VerifyCodeResponse {
  token: string;
  user: {
    id: string;
    email: string;
    telegramPhone: string;
  };
}
