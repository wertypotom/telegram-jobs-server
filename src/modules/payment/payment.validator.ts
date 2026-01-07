import Joi from 'joi';

export const createCheckoutSchema = Joi.object({
  variantId: Joi.string().required().messages({
    'string.empty': 'Variant ID is required',
    'any.required': 'Variant ID is required',
  }),
});
