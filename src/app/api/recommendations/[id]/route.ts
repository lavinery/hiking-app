import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { getAuth } from '@/server/auth/auth'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest, 
  { params }: RouteParams
) {
  try {
    const recommendationId = params.id
    
    if (!recommendationId) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 }
      )
    }

    // Get current user (optional)
    const session = await getAuth()

    // Find recommendation with all related data
    const recommendation = await db.recommendation.findUnique({
      where: { id: recommendationId },
      include: {
        intake: {
          select: {
            id: true,
            answersJson: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        items: {
          include: {
            route: {
              include: {
                mountain: true,
                criterionValues: {
                  include: {
                    criterion: {
                      include: {
                        factor: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { rank: 'asc' }
        }
      },
    })

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      )
    }

    // Check if user can access this recommendation
    const canAccess = !recommendation.intake.user?.id || 
                     recommendation.intake.user.id === session?.user?.id

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Format the response
    const formattedRoutes = recommendation.items.map(item => ({
      rank: item.rank,
      score: item.score.toNumber(),
      route: {
        id: item.route.id,
        name: item.route.name,
        difficulty: item.route.difficulty,
        distance: item.route.distance.toNumber(),
        duration: item.route.duration || 0,
        description: item.route.description || '',
        mountain: {
          id: item.route.mountain.id,
          name: item.route.mountain.name,
          location: item.route.mountain.location,
          elevation: item.route.mountain.elevation || 0,
          description: item.route.mountain.description || ''
        },
        criterionValues: item.route.criterionValues.map(cv => ({
          criterion: cv.criterion.name,
          factor: cv.criterion.factor.name,
          value: cv.valueDecimal.toNumber(),
          isBenefit: cv.criterion.isBenefit
        }))
      }
    }))

    // Calculate summary
    const averageScore = formattedRoutes.reduce((sum, route) => sum + route.score, 0) / formattedRoutes.length

    const responseData = {
      id: recommendation.id,
      intakeId: recommendation.intakeId,
      createdAt: recommendation.createdAt.toISOString(),
      userName: recommendation.intake.user?.profile?.name || 'Anonymous',
      isOwn: recommendation.intake.user?.id === session?.user?.id,
      intakeAnswers: recommendation.intake.answersJson,
      topsisAnalysis: recommendation.topsisScoreJson || {},
      routes: formattedRoutes,
      summary: {
        totalRoutes: formattedRoutes.length,
        averageScore: Math.round(averageScore * 1000) / 1000,
        topRoute: formattedRoutes[0]?.route.name || 'No routes found',
        generatedAt: recommendation.createdAt.toISOString()
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching recommendation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const recommendationId = params.id
    const session = await getAuth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find existing recommendation
    const existingRecommendation = await db.recommendation.findUnique({
      where: { id: recommendationId },
      include: {
        intake: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!existingRecommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (existingRecommendation.intake.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete recommendation (cascade will handle items)
    await db.recommendation.delete({
      where: { id: recommendationId }
    })

    return NextResponse.json({
      message: 'Recommendation deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting recommendation:', error)
    return NextResponse.json(
      { error: 'Failed to delete recommendation' },
      { status: 500 }
    )
  }
}