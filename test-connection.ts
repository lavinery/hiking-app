import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...')
    
    await prisma.$connect()
    console.log('✅ Database connected successfully!')
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test, DATABASE() as current_db`
    console.log('✅ Query test result:', result)
    
    // Check if our database exists
    const databases = await prisma.$queryRaw`SHOW DATABASES LIKE 'hiking_gear_db'`
    console.log('📁 Database exists:', databases)
    
    if (Array.isArray(databases) && databases.length === 0) {
      console.log('⚠️  Database "hiking_gear_db" not found. Creating it...')
      await prisma.$executeRaw`CREATE DATABASE hiking_gear_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      console.log('✅ Database "hiking_gear_db" created!')
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:')
    console.error('Error code:', (error as any)?.code)
    console.error('Error message:', (error as any)?.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()