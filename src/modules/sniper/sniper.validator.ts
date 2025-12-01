import Joi from 'joi';

export const tailorResumeSchema = Joi.object({
  jobId: Joi.string().required(),
  masterResumeText: Joi.string().optional(),
});
