import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/server/db'
import { getAuth } from '@/server/auth/auth'
import { runTopsisAnalysis, saveTopsisResults, type UserPreferences } from '@/server/services/topsis.service'

const createRecommendationSchema = z.object({
  intakeId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createRecommendationSchema.parse(body)
    
    console.log('Creating recommendations for intake:', validatedData.intakeId)
    
    // Get intake with answers
    const intake = await db.intake.findUnique({
      where: { id: validatedData.intakeId },
    })

    if (!intake) {
      return NextResponse.json(
        { error: 'Intake not found' },
        { status: 404 }
      )
    }

    // Get current user
    const session = await getAuth()
    const userId = session?.user?.id || intake.userId

    // Extract user preferences from intake answers
    const answers = intake.answersJson as any
    console.log('Intake answers:', answers)

    const preferences: UserPreferences = {
      experience_level: answers.hiking_experience || answers.experience_level || 'intermediate',
      fitness_level: answers.fitness_level || 5,
      budget_range: answers.budget_range || '1m_2m',
      time_commitment: answers.time_commitment || '2_days',
      location: answers.location || 'jakarta',
      group_size: answers.group_size || 2,
      interests: answers.interests || [],
      concerns: answers.concerns || []
    }

    console.log('Processed preferences:', preferences)

    // Run TOPSIS analysis
    console.log('Running TOPSIS analysis...')
    const topsisResult = await runTopsisAnalysis(preferences)
    
    console.log(`TOPSIS completed. Found ${topsisResult.routes.length} routes.`)

    // Save results to database
    const recommendationId = await saveTopsisResults(
      validatedData.intakeId,
      userId,
      topsisResult
    )

    console.log('Saved recommendation:', recommendationId)

    return NextResponse.json(
      {
        id: recommendationId,
        intakeId: validatedData.intakeId,
        recommendations: topsisResult,
        message: 'Recommendations generated successfully using TOPSIS algorithm'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating recommendation:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: error.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getAuth()
    
    // Get recent recommendations (with user context if authenticated)
    const recommendations = await db.recommendation.findMany({
      where: session?.user?.id ? { userId: session.user.id } : {},
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        intake: {
          select: {
            id: true,
            createdAt: true,
          }
        },
        items: {
          include: {
            route: {
              include: {
                mountain: true
              }
            }
          },
          orderBy: { rank: 'asc' },
          take: 3 // Top 3 items per recommendation
        }
      }
    })

    const formattedRecommendations = recommendations.map(rec => ({
      id: rec.id,
      intakeId: rec.intakeId,
      createdAt: rec.createdAt,
      topRoutes: rec.items.map(item => ({
        rank: item.rank,
        routeName: item.route.name,
        mountainName: item.route.mountain.name,
        score: item.score.toNumber()
      }))
    }))

    return NextResponse.json({
      recommendations: formattedRecommendations
    })
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}