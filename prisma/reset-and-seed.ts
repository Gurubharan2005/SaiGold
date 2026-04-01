import { PrismaClient, Status, Priority } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Database Reset Initiated ---')

  // 1. Delete all Customer Documents
  await prisma.customerDocument.deleteMany({})
  console.log('✓ All Customer Documents cleared')

  // 2. Delete all Customers (Leads, Assignments, etc.)
  await prisma.customer.deleteMany({})
  console.log('✓ All Customer records cleared')

  console.log('--- Re-Seeding 20 Meta Leads ---')

  const dummyLeads = [
    { name: 'Aruna Kumar', phone: '9840123456', branch: 'Chennai Central' },
    { name: 'Balaji S', phone: '9840234567', branch: 'Anna Nagar' },
    { name: 'Chitra Devi', phone: '9840345678', branch: 'T Nagar' },
    { name: 'Dinesh Karthik', phone: '9840456789', branch: 'Velachery' },
    { name: 'Eswari M', phone: '9840567890', branch: 'Adyar' },
    { name: 'Farooq Ahmed', phone: '9840678901', branch: 'Tambaram' },
    { name: 'Gowtham Raj', phone: '9840789012', branch: 'Ambattur' },
    { name: 'Hari Prasad', phone: '9840890123', branch: 'Saidapet' },
    { name: 'Indira Gandhi', phone: '9840901234', branch: 'Egmore' },
    { name: 'Jeeva R', phone: '9841012345', branch: 'Mylapore' },
    { name: 'Karthik Raja', phone: '9841123456', branch: 'Perambur' },
    { name: 'Latha Mani', phone: '9841234567', branch: 'Ayanavaram' },
    { name: 'Mohamed Ali', phone: '9841345678', branch: 'Royapettah' },
    { name: 'Naveen Kumar', phone: '9841456789', branch: 'Pallavaram' },
    { name: 'Oviya S', phone: '9841567890', branch: 'Chromepet' },
    { name: 'Prakash Raj', phone: '9841678901', branch: 'Avadi' },
    { name: 'Queen Victoria', phone: '9841789012', branch: 'Guindy' },
    { name: 'Ravi Teja', phone: '9841890123', branch: 'Nungambakkam' },
    { name: 'Srinivasan K', phone: '9841901234', branch: 'Koyambedu' },
    { name: 'Tamil Selvan', phone: '9842012345', branch: 'Madhavaram' },
  ]

  for (const lead of dummyLeads) {
    await prisma.customer.create({
      data: {
        name: lead.name,
        phone: lead.phone,
        branch: lead.branch,
        status: Status.WAITING,
        priority: Priority.MEDIUM,
        createdAt: new Date(),
      }
    })
  }

  console.log('✓ Successfully imported 20 fresh Meta Leads')
  console.log('--- Database Start Fresh Completed ---')
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
