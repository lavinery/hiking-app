import { authGuard } from '@/server/auth/guard'
import { db } from '@/server/db'
import { Button } from '@/lib/ui/Button'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { LogOutButton } from '@/components/LogOutButton'

export default async function HistoryPage() {
  // Protect this page - require authentication
  const { user } = await authGuard()

  // Fetch user's recommendations
  const recommendations = await db.recommendation.findMany({
    where: { userId: user.id },
    include: {
      intake: true,
      items: {
        include: {
          route: {
            include: {
              mountain: true
            }
          }
        },
        orderBy: { rank: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Recommendation History
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {user.name || user.email}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/">Home</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/wizard">New Recommendation</Link>
              </Button>
              <LogOutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {recommendations.length === 0 ? (
          <div className="text-center py-12">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">No recommendations yet</h2>
              <p className="text-muted-foreground">
                Start by creating your first hiking recommendation
              </p>
              <Button asChild>
                <Link href="/wizard">Start Recommendation Wizard</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Your Recommendations ({recommendations.length})
              </h2>
            </div>

            <div className="grid gap-6">
              {recommendations.map((recommendation) => (
                <div key={recommendation.id} className="border rounded-lg p-6 bg-card">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        Recommendation from {new Date(recommendation.createdAt).toLocaleDateString()}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {recommendation.items.length} routes recommended
                      </span>
                    </div>

                    <div className="grid gap-3">
                      {recommendation.items.slice(0, 3).map((item, index) => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-3 bg-muted rounded"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">#{item.rank}</span>
                              <span className="font-medium">{item.route.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.route.mountain.name} • {item.route.difficulty} • {item.route.distance.toString()}km
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              Score: {(item.score.toNumber() * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {recommendation.items.length > 3 && (
                        <div className="text-center py-2">
                          <Button variant="ghost" size="sm">
                            View all {recommendation.items.length} recommendations
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm">
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}