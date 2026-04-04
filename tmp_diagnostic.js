const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('--- DB DIAGNOSTIC ---')
  console.log('Customer model fields:', Object.keys(prisma.customer))
  console.log('CustomerActivity model available:', !!prisma.customerActivity)
  await prisma.$disconnect()
}

main().catch(console.error)
