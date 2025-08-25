import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, UseFormProps, FieldValues, Path } from 'react-hook-form'
import { z, ZodSchema } from 'zod'

/**
 * Type-safe useForm hook with Zod validation
 */
export function useZodForm<T extends FieldValues>(
  schema: ZodSchema<T>,
  formProps?: Omit<UseFormProps<T>, 'resolver'>
) {
  return useForm<T>({
    resolver: zodResolver(schema),
    ...formProps,
  })
}

/**
 * Helper to extract form field errors with proper typing
 */
export function getFieldError<T extends FieldValues>(
  errors: any,
  name: Path<T>
): string | undefined {
  const error = errors[name]
  return error?.message
}

/**
 * Common validation schemas
 */
export const commonValidations = {
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  required: (message = 'This field is required') => z.string().min(1, message),
  optionalString: z.string().optional(),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonEmptyArray: <T>(message = 'Please select at least one option') =>
    z.array(z.any()).min(1, message) as z.ZodArray<z.ZodType<T>>,
}

/**
 * Form field props type for easy prop spreading
 */
export type FormFieldProps<T extends FieldValues> = {
  name: Path<T>
  error?: string
  onChange: (value: any) => void
  onBlur: () => void
  value: any
}

/**
 * Helper to create form field props
 */
export function createFieldProps<T extends FieldValues>(
  register: any,
  errors: any,
  name: Path<T>
): FormFieldProps<T> {
  const field = register(name)
  return {
    name,
    error: getFieldError(errors, name),
    ...field,
  }
}