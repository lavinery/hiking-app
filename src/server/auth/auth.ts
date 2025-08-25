import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { UserRole } from '@prisma/client'

export type AuthSession = {
  user: {
    id: string
    email: string
    role: UserRole
    name?: string | null
  }
}

/**
 * Get the current server-side session
 */
export async function getAuth(): Promise<AuthSession | null> {
  const session = await getServerSession(authOptions)
  return session as AuthSession | null
}

/**
 * Get the current user or throw if not authenticated
 */
export async function getCurrentUser() {
  const session = await getAuth()
  
  if (!session?.user) {
    throw new Error('Not authenticated')
  }
  
  return session.user
}

/**
 * Check if user has required role
 */
export function hasRole(user: { role: UserRole }, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(user.role)
}

/**
 * Check if user is admin
 */
export function isAdmin(user: { role: UserRole }): boolean {
  return user.role === UserRole.ADMIN
}