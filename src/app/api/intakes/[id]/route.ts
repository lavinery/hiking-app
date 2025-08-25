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
    const intakeId = params.id
    
    if (!intakeId) {
      return NextResponse.json(
        { error: 'Intake ID is required' },
        { status: 400 }
      )
    }

    // Get current user (optional)
    const session = await getAuth()

    // Find intake
    const intake = await db.intake.findUnique({
      where: { id: intakeId },
      include: {
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
        recommendations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    })

    if (!intake) {
      return NextResponse.json(
        { error: 'Intake not found' },
        { status: 404 }
      )
    }

    // Check if user can access this intake
    // For now, allow access to any intake (can be restricted later)
    const canAccess = !intake.userId || intake.userId === session?.user?.id

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      id: intake.id,
      answersJson: intake.answersJson,
      createdAt: intake.createdAt,
      updatedAt: intake.updatedAt,
      userName: intake.user?.profile?.name || 'Anonymous',
      isOwn: intake.userId === session?.user?.id,
      hasRecommendations: intake.recommendations.length > 0,
      latestRecommendationId: intake.recommendations[0]?.id,
    })
  } catch (error) {
    console.error('Error fetching intake:', error)
    return NextResponse.json(
      { error: 'Failed to fetch intake' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const intakeId = params.id
    const session = await getAuth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Find existing intake
    const existingIntake = await db.intake.findUnique({
      where: { id: intakeId },
    })

    if (!existingIntake) {
      return NextResponse.json(
        { error: 'Intake not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (existingIntake.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Update intake
    const updatedIntake = await db.intake.update({
      where: { id: intakeId },
      data: {
        answersJson: body.answersJson || existingIntake.answersJson,
      },
    })

    return NextResponse.json({
      id: updatedIntake.id,
      message: 'Intake updated successfully',
      updatedAt: updatedIntake.updatedAt,
    })
  } catch (error) {
    console.error('Error updating intake:', error)
    return NextResponse.json(
      { error: 'Failed to update intake' },
      { status: 500 }
    )
  }
}