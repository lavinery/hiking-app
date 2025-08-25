// Create this file: src/app/api/debug/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'

export async function GET() {
  try {
    // Test database connection
    const testQuery = await db.$queryRaw`SELECT 1 as test`
    
    return NextResponse.json({
      status: 'API working',
      database: 'connected',
      query_result: testQuery,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    // Test intake creation with minimal data
    const testIntake = await db.intake.create({
      data: {
        userId: null, // Anonymous for testing
        answersJson: body.answersJson || { test: true }
      }
    })
    
    return NextResponse.json({
      success: true,
      intake: testIntake,
      message: 'Test intake created successfully'
    })
  } catch (error) {
    console.error('Debug POST error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create test intake',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack'
      },
      { status: 500 }
    )
  }
}