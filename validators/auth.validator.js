const Joi = require("joi");

const passwordComplexity = new RegExp(
  "^(?=.*[a-zA-Zа-яА-Я])(?=.*[A-ZА-Я])(?=.*\\d)(?=.*[!@#%^&*_=+\\-\\/\\\\]).{8,}$"
); // Пароль: минимум 8 символов, одна заглавная буква, одна строчная буква, одна цифра и один специальный символ

const loginPattern = /^[a-zA-Zа-яА-ЯёЁ0-9]+$/; // Разрешенные символы: латиница, кириллица и цифры

// Валидация для регистрации
const registerSchema = Joi.object({
  login: Joi.string().min(3).max(30).pattern(loginPattern).required().messages({
    "string.min": "Логин должен содержать не менее 3 символов.",
    "string.max": "Логин не должен превышать 30 символов.",
    "string.pattern.base": "Логин содержит недопустимые символы.",
  }),
  password: Joi.string().pattern(passwordComplexity).required().messages({
    "string.pattern.base":
      "Пароль должен содержать минимум 8 символов, включая заглавные буквы, строчные буквы, цифры и специальные символы.",
  }),
  role: Joi.string().valid("root", "manager", "artist").required(),
  email: Joi.string().email(),
});

// Валидация для входа
const loginSchema = Joi.object({
  login: Joi.string().pattern(loginPattern).required(),
  password: Joi.string().pattern(passwordComplexity).required(),
});

// Валидация для изменения пароля
const passwordSchema = Joi.object({
  password: Joi.string().pattern(passwordComplexity).required().messages({
    "string.pattern.base":
      "Пароль должен содержать минимум 8 символов, включая заглавные буквы, строчные буквы, цифры и специальные символы.",
  }),
});

// Валидация для изменения email
const emailSchema = Joi.object({
  email: Joi.string().email(),
});

module.exports = {
  registerSchema,
  loginSchema,
  passwordSchema,
  emailSchema,
};
