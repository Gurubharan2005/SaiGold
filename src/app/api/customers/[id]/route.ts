import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json()
    const { id } = await params
    const { status, assignedToId, notes, loanAmount, goldWeight, dueDate, photoUrl } = body

    // We can dynamically define updates based on the exact keys sent.
    const updateData: any = {}
    if (status) updateData.status = status
    if (assignedToId) updateData.assignedToId = assignedToId
    if (notes !== undefined) updateData.notes = notes
    if (loanAmount !== undefined) updateData.loanAmount = loanAmount
    if (goldWeight !== undefined) updateData.goldWeight = goldWeight
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // 1. Fetch exactly all the documents mathematically attached to this loan natively
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        documents: true,
      }
    })

    if (!customer) {
       return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // 2. Iterate heavily and purge the Vercel Blob entries via native S3 execution parameters
    if (customer.documents && customer.documents.length > 0) {
       const deletePromises = customer.documents.map((doc: any) => del(doc.documentUrl))
       await Promise.allSettled(deletePromises)
    }

    // 3. Drop the customer context mapping from PostgreSQL dynamically cascading deletion to the Document tables automatically
    await prisma.customer.delete({
      where: { id }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
     console.error('Delete Customer Data Scrub Error:', error)
     return NextResponse.json({ error: 'Failed to purge database fully' }, { status: 500 })
  }
}
