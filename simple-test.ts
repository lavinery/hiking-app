import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function simpleTest() {
  try {
    console.log('🔄 Testing basic connection...')
    
    // Just test connection without queries
    await prisma.$connect()
    console.log('✅ Basic connection successful!')
    
  } catch (error) {
    console.error('❌ Basic connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

simpleTest()