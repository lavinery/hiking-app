// Replace src/app/api/intakes/route.ts with this simplified version:
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/intakes called')
    
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    // Validate that answersJson exists
    if (!body.answersJson) {
      return NextResponse.json(
        { error: 'answersJson is required' },
        { status: 400 }
      )
    }
    
    console.log('Creating intake with data:', body.answersJson)
    
    // Create intake with minimal validation
    const intake = await db.intake.create({
      data: {
        userId: null, // Anonymous for now
        answersJson: body.answersJson,
      },
    })
    
    console.log('Created intake:', intake.id)
    
    return NextResponse.json(
      { 
        id: intake.id,
        message: 'Intake created successfully',
        timestamp: intake.createdAt 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/intakes:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to create intake',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    console.log('GET /api/intakes called')
    
    const intakes = await db.intake.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        userId: true,
      },
    })
    
    return NextResponse.json({ intakes })
  } catch (error) {
    console.error('Error in GET /api/intakes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch intakes' },
      { status: 500 }
    )
  }
}