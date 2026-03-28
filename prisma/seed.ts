import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const manager = await prisma.user.upsert({
    where: { email: 'admin@saigoldloans.com' },
    update: {},
    create: {
      email: 'admin@saigoldloans.com',
      name: 'Admin Manager',
      password: hashedPassword,
      role: 'MANAGER',
    },
  })

  console.log({ manager })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
