import { redirect } from 'next/navigation'
import { getAuth } from './auth'
import { UserRole } from '@prisma/client'

export type AuthGuardOptions = {
  role?: UserRole[]
  redirectTo?: string
  allowUnauthenticated?: boolean
}

/**
 * Server-side authentication guard
 * Use in server components, page.tsx, or API routes
 */
export async function authGuard(options: AuthGuardOptions = {}) {
  const {
    role,
    redirectTo = '/login',
    allowUnauthenticated = false
  } = options

  const session = await getAuth()

  // Check authentication
  if (!session?.user) {
    if (allowUnauthenticated) {
      return { user: null, isAuthenticated: false }
    }
    redirect(redirectTo)
  }

  const user = session.user

  // Check role requirements
  if (role && role.length > 0) {
    if (!role.includes(user.role)) {
      // User doesn't have required role
      throw new Error(`Access denied. Required roles: ${role.join(', ')}`)
    }
  }

  return { user, isAuthenticated: true }
}

/**
 * Admin-only guard
 */
export async function adminGuard(redirectTo = '/login') {
  return authGuard({ 
    role: [UserRole.ADMIN], 
    redirectTo 
  })
}

/**
 * User or Admin guard
 */
export async function userGuard(redirectTo = '/login') {
  return authGuard({ 
    role: [UserRole.USER, UserRole.ADMIN], 
    redirectTo 
  })
}