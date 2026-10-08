import { z } from 'zod'

// Country names are compared for the regional launch, so store them trimmed with single spaces.
export const countryField = z.string().transform((value) => value.trim().replace(/\s+/g, ' ')).pipe(z.string().min(2).max(80))

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

export const signupSchema = z
  .object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(80),
  age: z.coerce.number().int().min(18).max(100),
  country: countryField,
  city: z.string().max(80).optional(),
  bio: z.string().max(280).optional(),
  // Only needed for dating: people here for films & friends can skip it.
  gender: z.enum(['male', 'female', 'nonbinary']).optional(),
  // Who they want to see in the deck; defaults from gender when left out (see lib/datingEligibility.js).
  interestedIn: z.array(z.enum(['male', 'female', 'nonbinary'])).min(1).max(3).optional(),
  // "Here for": films & friends only (false) or dating too (true, the default for older clients).
  datingEnabled: z.boolean().optional(),
  termsAccepted: z.literal(true),
  referralCode: z.string().max(32).optional()
  })
  .refine((body) => body.datingEnabled === false || Boolean(body.gender), {
    message: 'Choose how you identify to use dating',
    path: ['gender']
  })
  // Dating opens city by city.
  .refine((body) => body.datingEnabled === false || Boolean(body.city?.trim()), {
    message: 'Add your city to use dating',
    path: ['city']
  })

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
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

// Must match the reports.reason / reports.details constraints in the database.
export const REPORT_REASONS = ['spam', 'harassment', 'fake_profile', 'inappropriate', 'other']

export const reportSchema = z.object({
  userId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(1000).optional(),
  block: z.boolean().optional()
})

export const blockSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().max(200).optional()
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
