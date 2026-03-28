import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json()
    const { id } = await params
    const { status, assignedToId, notes, loanAmount, goldWeight, dueDate } = body

    // We can dynamically define updates based on the exact keys sent.
    const updateData: any = {}
    if (status) updateData.status = status
    if (assignedToId) updateData.assignedToId = assignedToId
    if (notes !== undefined) updateData.notes = notes
    if (loanAmount !== undefined) updateData.loanAmount = loanAmount
    if (goldWeight !== undefined) updateData.goldWeight = goldWeight
    if (dueDate) updateData.dueDate = new Date(dueDate)

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, customer: updatedCustomer }, { status: 200 })
  } catch (error) {
    console.error('Update Customer Error:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}
