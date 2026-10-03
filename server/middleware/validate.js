import { z } from 'zod'

function firstFieldMessage(fieldErrors) {
  const first = Object.entries(fieldErrors || {}).find(([, messages]) => Array.isArray(messages) && messages.length)
  return first ? `${first[0]}: ${first[1][0]}` : 'Validation failed'
}

export function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      return res.status(400).json({
        message: firstFieldMessage(fieldErrors),
        code: 'VALIDATION_ERROR',
        details: fieldErrors,
        requestId: req.requestId
      })
    }
    req.body = parsed.data
    next()
  }
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
        requestId: req.requestId
      })
    }
    req.query = parsed.data
    next()
  }
}

export const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(80),
  age: z.coerce.number().int().min(18).max(100),
  country: z.string().min(2).max(80),
  city: z.string().max(80).optional(),
  bio: z.string().max(280).optional(),
  gender: z.enum(['male', 'female']),
  termsAccepted: z.literal(true),
  referralCode: z.string().max(32).optional()
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128)
})

export const swipeSchema = z.object({
  targetId: z.string().uuid(),
  action: z.enum(['like', 'pass'])
})

export const messageSchema = z.object({
  toUserId: z.string().uuid(),
  text: z.string().min(1).max(2000)
})

export const reportSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(3).max(120),
  details: z.string().max(2000).optional()
})

export const forgotPasswordSchema = z.object({
  email: z.string().email()
})

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128)
})

export const verifyEmailSchema = z.object({
  token: z.string().min(20)
})
