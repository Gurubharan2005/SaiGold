import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { format } from 'date-fns'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json()
    const { id } = await params
    const { 
      status, assignedToId, notes, loanAmount, goldWeight, dueDate, photoUrl, 
      priority, callStatus, branch, followUpDate, followUpNotes, appendNote,
      name, phone, interestRate, startDate, isVerified, verifiedAt, verifiedById,
      lastCalledAt, markCalled
    } = body

    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    const session = token ? await decrypt(token) : null

    const currentCustomer = await prisma.customer.findUnique({ where: { id } })
    if (!currentCustomer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // We can dynamically define updates based on the exact keys sent.
    const updateData: any = {}
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (status) updateData.status = status
    if (assignedToId) {
       updateData.assignedToId = assignedToId
       if (!currentCustomer.assignedAt) updateData.assignedAt = new Date()
    }
    if (notes !== undefined) updateData.notes = notes
    if (loanAmount !== undefined) updateData.loanAmount = loanAmount
    if (goldWeight !== undefined) updateData.goldWeight = goldWeight
    if (interestRate !== undefined) updateData.interestRate = interestRate
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl
    if (startDate) updateData.startDate = new Date(startDate)
    if (dueDate) updateData.dueDate = new Date(dueDate)
    if (priority) updateData.priority = priority
    if (branch !== undefined) updateData.branch = branch
    if (followUpDate) updateData.followUpDate = new Date(followUpDate)
    if (followUpNotes !== undefined) updateData.followUpNotes = followUpNotes
    
    // Verification fields
    if (isVerified !== undefined) updateData.isVerified = isVerified
    if (verifiedAt) updateData.verifiedAt = new Date(verifiedAt)
    if (verifiedById) updateData.verifiedById = verifiedById
    
    // Call dismissal tracking
    if (markCalled) {
       updateData.lastCalledAt = new Date()
    } else if (lastCalledAt) {
       updateData.lastCalledAt = new Date(lastCalledAt)
    }
    
    // Note Appendage Tracking
    if (appendNote) {
      const timestamp = format(new Date(), '[MMM dd - h:mm a]')
      const formattedNote = `\n${timestamp} ${session?.name || 'Staff'}: ${appendNote}`
      updateData.notes = currentCustomer.notes ? currentCustomer.notes + formattedNote : formattedNote.trim()
    }

    // Call Status & Smart Response Tracker
    if (callStatus) {
      updateData.callStatus = callStatus
      if (callStatus !== 'NOT_CALLED' && !currentCustomer.firstContactAt) {
        const now = new Date()
        updateData.firstContactAt = now
        // Dynamically compute the exact response cycle natively natively locking tracking metadata cleanly
        if (currentCustomer.assignedAt) {
          updateData.responseTime = Math.round((now.getTime() - currentCustomer.assignedAt.getTime()) / 60000)
        } else {
          updateData.responseTime = Math.round((now.getTime() - currentCustomer.createdAt.getTime()) / 60000)
        }
      }
    }

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
