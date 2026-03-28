import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, phone, goldWeight, loanAmount, branch, notes, status } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and Phone are required' }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        goldWeight: goldWeight || null,
        loanAmount: loanAmount || null,
        branch: branch || null,
        notes: notes || null,
        status: status || 'PROCESSING',
      }
    })

    return NextResponse.json({ success: true, customer }, { status: 201 })
  } catch (error) {
    console.error('Create Customer Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
