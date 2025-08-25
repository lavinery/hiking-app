'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/lib/ui/Button'

export function LogOutButton() {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <Button variant="ghost" onClick={handleSignOut}>
      Sign Out
    </Button>
  )
}