import { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { userGuard } from '@/server/auth/guard'
import { Button } from '@/lib/ui/Button'
import RecommendationHistory from '@/components/RecommendationHistory'
import { LogOutButton } from '@/components/LogOutButton'
import { Plus, User, Settings } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Recommendation History - Hiking Gear App',
  description: 'View and manage your hiking route recommendation history',
  robots: 'noindex', // Private page
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

// ... rest remains the same
export default async function HistoryPage() {
  const { user } = await userGuard('/login')

  return (
    <div className="min-h-screen bg-background">
      {/* ... existing JSX remains the same */}
      <header className="border-b border-border bg-card/50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-foreground">Recommendation History</h1>
              <p className="text-muted-foreground">
                Welcome back, {user.name || user.email}! Here are your past hiking recommendations.
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              {user.role === 'ADMIN' && (
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button asChild>
                <Link href="/wizard">
                  <Plus className="h-4 w-4 mr-2" />
                  New Recommendation
                </Link>
              </Button>
              <LogOutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-muted/20">
        <div className="container py-3">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>→</span>
            <span className="font-medium text-foreground">History</span>
          </nav>
        </div>
      </div>

      <main className="container py-8">
        <Suspense fallback={
          <div className="space-y-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-6 space-y-4">
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-48"></div>
                      <div className="h-3 bg-muted rounded w-32"></div>
                    </div>
                    <div className="h-8 bg-muted rounded w-20"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-16 bg-muted rounded"></div>
                    <div className="h-16 bg-muted rounded"></div>
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        }>
          <RecommendationHistory userId={user.id} />
        </Suspense>

        <div className="mt-12 flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/wizard">Create New Recommendation</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}

export const dynamic = 'force-dynamic'