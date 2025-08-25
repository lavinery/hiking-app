import { z } from 'zod'

/**
 * Common validation patterns with security hardening
 */

// String validation with length limits and sanitization
export const safeString = (minLength = 1, maxLength = 255) =>
  z.string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must be at most ${maxLength} characters`)
    .trim()
    .refine(
      (val) => !/<script|javascript:|data:/i.test(val),
      'Invalid characters detected'
    )

// Email validation with additional security
export const safeEmail = z
  .string()
  .email('Invalid email format')
  .max(254, 'Email too long') // RFC 5321 limit
  .toLowerCase()
  .refine(
    (email) => {
      // Block suspicious patterns
      const suspiciousPatterns = [
        /\+.*\+/, // Multiple plus signs
        /@.*@/,   // Multiple @ signs in local part
        /\.\./,   // Consecutive dots
      ]
      return !suspiciousPatterns.some(pattern => pattern.test(email))
    },
    'Invalid email format'
  )

// Password validation with security requirements
export const safePassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .refine(
    (password) => /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => /[0-9]/.test(password),
    'Password must contain at least one number'
  )
  .refine(
    (password) => !/(.)\1{2,}/.test(password),
    'Password cannot contain repeated characters'
  )

// UUID validation
export const safeUuid = z
  .string()
  .uuid('Invalid ID format')

// Positive integer with reasonable limits
export const safePositiveInt = (max = 999999) =>
  z.coerce.number()
    .int('Must be a whole number')
    .min(1, 'Must be positive')
    .max(max, `Must be less than ${max}`)

// Decimal with precision limits
export const safeDecimal = (min = 0, max = 999999.99) =>
  z.coerce.number()
    .min(min, `Must be at least ${min}`)
    .max(max, `Must be at most ${max}`)
    .refine((val) => Number.isFinite(val), 'Invalid number')

// JSON validation with size limits
export const safeJson = (maxKeys = 50, maxDepth = 5) =>
  z.unknown()
    .refine(
      (val) => {
        if (typeof val !== 'object' || val === null || Array.isArray(val)) {
          return false
        }
        
        // Check number of keys
        const keyCount = Object.keys(val).length
        if (keyCount > maxKeys) {
          return false
        }
        
        // Check depth (basic implementation)
        const checkDepth = (obj: any, depth = 0): boolean => {
          if (depth > maxDepth) return false
          if (typeof obj !== 'object' || obj === null) return true
          
          return Object.values(obj).every(value => checkDepth(value, depth + 1))
        }
        
        return checkDepth(val)
      },
      `JSON object too complex (max ${maxKeys} keys, depth ${maxDepth})`
    )

// Enum validation with allowlist
export const safeEnum = <T extends string>(values: readonly T[], message?: string) =>
  z.enum(values as [T, ...T[]], {
    errorMap: () => ({ message: message || `Must be one of: ${values.join(', ')}` })
  })

// Array validation with size limits
export const safeArray = <T>(itemSchema: z.ZodType<T>, maxLength = 100) =>
  z.array(itemSchema)
    .max(maxLength, `Too many items (max ${maxLength})`)

// Pagination parameters
export const paginationSchema = z.object({
  page: safePositiveInt(1000).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
})

/**
 * Hardened API validation schemas
 */

// Intake creation schema
export const createIntakeSchema = z.object({
  answersJson: safeJson(30, 3),
  userId: safeUuid.optional(),
}).strict()

// Recommendation creation schema
export const createRecommendationSchema = z.object({
  intakeId: safeUuid,
}).strict()

// User preferences schema (from intake answers)
export const userPreferencesSchema = z.object({
  experience_level: safeEnum(['beginner', 'intermediate', 'advanced', 'expert']),
  fitness_level: z.coerce.number().min(1).max(10),
  budget_range: safeEnum(['under_500k', '500k_1m', '1m_2m', '2m_5m', 'above_5m']),
  time_commitment: safeEnum(['half_day', 'full_day', '2_days', '3_days', '4_plus_days']),
  location: safeString(2, 50),
  group_size: safePositiveInt(20),
  interests: safeArray(safeString(2, 50), 10),
  concerns: safeArray(safeString(2, 50), 10).optional(),
}).strict()

// Search and filter schema
export const searchFilterSchema = z.object({
  mine: z.enum(['1']).optional(),
  page: paginationSchema.shape.page,
  limit: paginationSchema.shape.limit,
  sort: safeEnum(['newest', 'oldest', 'score']).default('newest'),
  search: safeString(1, 100).optional(),
}).strict()

/**
 * Request body size validation
 */
export const validateRequestSize = (maxSize: number) => {
  return (request: Request) => {
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new Error(`Request body too large (max ${maxSize} bytes)`)
    }
  }
}

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '')  // Remove javascript: protocol
    .replace(/data:/gi, '')        // Remove data: protocol
    .replace(/on\w+\s*=/gi, '')    // Remove event handlers
}

/**
 * Validate and sanitize user input
 */
export const processUserInput = <T>(
  schema: z.ZodType<T>,
  input: unknown,
  options: { sanitize?: boolean } = {}
): T => {
  // Sanitize strings if requested
  if (options.sanitize && typeof input === 'object' && input !== null) {
    const sanitized = JSON.parse(JSON.stringify(input), (key, value) => {
      if (typeof value === 'string') {
        return sanitizeString(value)
      }
      return value
    })
    input = sanitized
  }

  return schema.parse(input)
}