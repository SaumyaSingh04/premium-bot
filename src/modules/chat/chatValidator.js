import Joi from 'joi';

export const chatSchema = Joi.object({
  message: Joi.string().min(1).max(4096).required(),
  userId: Joi.string().optional(),
});

export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    return res.status(400).json({ success: false, message });
  }
  next();
};
