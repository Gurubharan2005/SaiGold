import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const assignments = await prisma.customer.findMany({
    where: { 
      status: 'ACCEPTED' 
    },
    include: {
      assignedTo: {
        select: { id: true, name: true, role: true }
      }
    }
  })

  console.log('--- CURRENT ACCEPTED ASSIGNMENTS ---')
  console.table(assignments.map(a => ({
    customer: a.name,
    staff: a.assignedTo?.name || 'Unassigned',
    staffRole: a.assignedTo?.role || 'N/A'
  })))

  // Also check "Admin Manager"
  const admin = await prisma.user.findFirst({
    where: { name: 'Admin Manager' }
  })
  
  if (admin) {
    const adminLeads = await prisma.customer.count({
      where: { assignedToId: admin.id }
    })
    console.log(`Admin Manager (${admin.id}) has ${adminLeads} assignments.`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
