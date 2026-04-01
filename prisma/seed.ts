import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const manager = await prisma.user.upsert({
    where: { email: 'admin@saigoldloans.com' },
    update: { password: hashedPassword, name: 'Admin Manager', role: 'MANAGER' },
    create: { email: 'admin@saigoldloans.com', name: 'Admin Manager', password: hashedPassword, role: 'MANAGER' },
  })

  const staff = await prisma.user.upsert({
    where: { email: 'staff@saigoldloans.com' },
    update: { password: hashedPassword, name: 'Demo Staff', role: 'STAFF' },
    create: { email: 'staff@saigoldloans.com', name: 'Demo Staff', password: hashedPassword, role: 'STAFF' },
  })

  const sales = await prisma.user.upsert({
    where: { email: 'sales@saigoldloans.com' },
    update: { password: hashedPassword, name: 'Sales Executive', role: 'SALESMAN' },
    create: { email: 'sales@saigoldloans.com', name: 'Sales Executive', password: hashedPassword, role: 'SALESMAN' },
  })

  console.log({ manager: manager.email, staff: staff.email, sales: sales.email })
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
