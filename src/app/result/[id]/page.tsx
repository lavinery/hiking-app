import { Suspense } from 'react'
import { Metadata, Viewport } from 'next'
import RecommendationResults from '@/components/RecommendationResults'
import { db } from '@/server/db'
import { notFound } from 'next/navigation'

interface ResultPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ResultPageProps): Promise<Metadata> {
  // ... existing metadata logic without viewport
  try {
    const recommendation = await db.recommendation.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        createdAt: true,
        items: {
          take: 1,
          orderBy: { rank: 'asc' },
          include: {
            route: {
              include: {
                mountain: true
              }
            }
          }
        }
      }
    })

    if (!recommendation) {
      return {
        title: 'Recommendation Not Found',
        description: 'The requested hiking recommendation could not be found.'
      }
    }

    const topRoute = recommendation.items[0]
    const routeName = topRoute?.route.name || 'Hiking Recommendation'
    const mountainName = topRoute?.route.mountain.name || ''

    return {
      title: `${routeName} - Hiking Recommendation`,
      description: `Personalized hiking recommendation for ${routeName}${mountainName ? ` on ${mountainName}` : ''}, generated on ${new Date(recommendation.createdAt).toLocaleDateString()}`,
      keywords: ['hiking', 'recommendation', 'outdoor', routeName, mountainName].filter(Boolean),
    }
  } catch (error) {
    return {
      title: 'Hiking Recommendation',
      description: 'View your personalized hiking route recommendations'
    }
  }
}

// Separate viewport export
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

// ... rest of the component remains the same
export default async function ResultPage({ params }: ResultPageProps) {
  const recommendationExists = await db.recommendation.findUnique({
    where: { id: params.id },
    select: { id: true }
  })

  if (!recommendationExists) {
    notFound()
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold">Loading Your Recommendations</h2>
          <p className="text-muted-foreground">Preparing your hiking analysis...</p>
        </div>
      </div>
    }>
      <RecommendationResults recommendationId={params.id} />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
export const revalidate = 3600