import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/server/auth/auth'
import { runTopsisAnalysis, saveTopsisResults, type UserPreferences } from '@/server/services/topsis.service'
import { 
  createRateLimitMiddleware,
  recommendationsRateLimit,
  addSecurityHeaders,
  generalApiRateLimit
} from '@/server/security/rateLimit'
import { 
  createRecommendationSchema,
  searchFilterSchema,
  userPreferencesSchema,
  processUserInput,
  validateRequestSize
} from '@/server/security/validation'
import { db } from '@/server/db'

// Rate limit middleware
const rateLimitCheck = createRateLimitMiddleware(recommendationsRateLimit)
const generalRateLimitCheck = createRateLimitMiddleware(generalApiRateLimit)

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimitCheck(request)
    if (rateLimitResult instanceof Response) {
      return addSecurityHeaders(rateLimitResult)
    }

    // Validate request size (1MB limit)
    validateRequestSize(1024 * 1024)(request)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = processUserInput(
      createRecommendationSchema, 
      body, 
      { sanitize: true }
    )
    
    console.log('Creating recommendations for intake:', validatedData.intakeId)
    
    // Get intake with answers
    const intake = await db.intake.findUnique({
      where: { id: validatedData.intakeId },
    })

    if (!intake) {
      const response = NextResponse.json(
        { error: 'Intake not found' },
        { status: 404 }
      )
      return addSecurityHeaders(response)
    }

    // Get current user
    const session = await getAuth()
    const userId = session?.user?.id || intake.userId

    // Validate and process user preferences
    const answers = intake.answersJson as any
    console.log('Processing intake answers...')

    // Extract preferences with validation
    const rawPreferences = {
      experience_level: answers.hiking_experience || answers.experience_level || 'intermediate',
      fitness_level: answers.fitness_level || 5,
      budget_range: answers.budget_range || '1m_2m',
      time_commitment: answers.time_commitment || '2_days',
      location: answers.location || 'jakarta',
      group_size: answers.group_size || 2,
      interests: Array.isArray(answers.interests) ? answers.interests : [],
      concerns: Array.isArray(answers.concerns) ? answers.concerns : []
    }

    const preferences = processUserInput(
      userPreferencesSchema,
      rawPreferences,
      { sanitize: true }
    )

    console.log('Validated preferences:', preferences)

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

    const response = NextResponse.json(
      {
        id: recommendationId,
        intakeId: validatedData.intakeId,
        recommendations: topsisResult,
        message: 'Recommendations generated successfully using TOPSIS algorithm'
      },
      { 
        status: 201,
        headers: rateLimitResult.headers
      }
    )

    return addSecurityHeaders(response)

  } catch (error) {
    console.error('Error creating recommendation:', error)
    
    let errorResponse: NextResponse

    if (error instanceof Error && error.message.includes('Request body too large')) {
      errorResponse = NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      )
    } else if (error && typeof error === 'object' && 'issues' in error) {
      // Zod validation error
      errorResponse = NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: (error as any).issues?.map((issue: any) => ({
            field: issue.path?.join('.') || 'unknown',
            message: issue.message
          })) || []
        },
        { status: 400 }
      )
    } else {
      errorResponse = NextResponse.json(
        { 
          error: 'Failed to generate recommendations',
          message: 'An internal error occurred. Please try again later.'
        },
        { status: 500 }
      )
    }
    
    return addSecurityHeaders(errorResponse)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Apply general rate limiting for GET requests
    const rateLimitResult = generalRateLimitCheck(request)
    if (rateLimitResult instanceof Response) {
      return addSecurityHeaders(rateLimitResult)
    }

    const session = await getAuth()
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const params = processUserInput(searchFilterSchema, {
      mine: searchParams.get('mine'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
      search: searchParams.get('search'),
    }, { sanitize: true })

    console.log('GET recommendations params:', params)

    // Build where clause
    const whereClause: any = {}
    
    if (params.mine === '1') {
      if (!session?.user?.id) {
        const response = NextResponse.json(
          { error: 'Authentication required for personal recommendations' },
          { status: 401 }
        )
        return addSecurityHeaders(response)
      }
      whereClause.userId = session.user.id
    }

    // Add search filter if provided
    if (params.search) {
      whereClause.OR = [
        {
          items: {
            some: {
              route: {
                name: {
                  contains: params.search,
                  mode: 'insensitive'
                }
              }
            }
          }
        },
        {
          items: {
            some: {
              route: {
                mountain: {
                  name: {
                    contains: params.search,
                    mode: 'insensitive'
                  }
                }
              }
            }
          }
        }
      ]
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' }
    
    switch (params.sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'score':
        orderBy = [{ createdAt: 'desc' }]
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // Get total count for pagination
    const totalCount = await db.recommendation.count({
      where: whereClause,
    })

    // Calculate pagination values
    const totalPages = Math.ceil(totalCount / params.limit)
    const skip = (params.page - 1) * params.limit

    // Get recommendations with related data
    const recommendations = await db.recommendation.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: params.limit,
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
          take: 5
        }
      }
    })

    // Format response
    const formattedRecommendations = recommendations.map(rec => ({
      id: rec.id,
      intakeId: rec.intakeId,
      createdAt: rec.createdAt.toISOString(),
      topRoutes: rec.items.map(item => ({
        rank: item.rank,
        routeName: item.route.name,
        mountainName: item.route.mountain.name,
        score: item.score.toNumber()
      }))
    }))

    const responseData = {
      recommendations: formattedRecommendations,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount,
        totalPages,
        hasNextPage: params.page < totalPages,
        hasPrevPage: params.page > 1,
      }
    }

    console.log(`Returning ${formattedRecommendations.length} recommendations (page ${params.page}/${totalPages})`)

    const response = NextResponse.json(responseData, {
      headers: rateLimitResult.headers
    })

    return addSecurityHeaders(response)

  } catch (error) {
    console.error('Error fetching recommendations:', error)
    
    let errorResponse: NextResponse
    
    if (error && typeof error === 'object' && 'issues' in error) {
      errorResponse = NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: (error as any).issues?.map((issue: any) => ({
            field: issue.path?.join('.') || 'unknown',
            message: issue.message
          })) || []
        },
        { status: 400 }
      )
    } else {
      errorResponse = NextResponse.json(
        { error: 'Failed to fetch recommendations' },
        { status: 500 }
      )
    }
    
    return addSecurityHeaders(errorResponse)
  }
}