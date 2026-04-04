import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { format } from 'date-fns'
import { Prisma } from '@prisma/client'

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
    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (status) updateData.status = status
    if (assignedToId) {
       updateData.assignedToId = assignedToId
       if (!currentCustomer.assignedAt) updateData.assignedAt = new Date()
       
       // Trigger Real-Time Mobile Push Alert for Manual Assignment
       const { triggerPushNotification } = await import('@/lib/push')
       triggerPushNotification(
         assignedToId,
         `New Lead - ${currentCustomer.name}`,
         `You have a new lead from Facebook. Tap to follow up with ${currentCustomer.name}.`,
         `/dashboard/customers/${id}`
       ).catch(e => console.error("[Manual Assign] Push Alert Failed:", e))
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
    
    // Handle Automated Verification Metadata
    if (status === 'MAINTENANCE' && session?.role === 'SALESMAN') {
      updateData.verifiedAt = new Date()
      updateData.verifiedById = session.id
      updateData.isVerified = true
    }

    // Manual field overrides (if provided)
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

    const { revalidatePath } = await import('next/cache')
    revalidatePath('/dashboard', 'layout')

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
       const deletePromises = customer.documents.map((doc) => del(doc.documentUrl))
       await Promise.allSettled(deletePromises)
       
       // Also delete document records from DB but keep the Customer record
       await prisma.customerDocument.deleteMany({
         where: { customerId: id }
       })
    }

    // 3. Mark the customer as CLOSED instead of full deletion
    await prisma.customer.update({
      where: { id },
      data: { 
        status: 'CLOSED',
        isVerified: true // Ensure it's marked as verified/archived
      }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
     console.error('Delete Customer Data Scrub Error:', error)
     return NextResponse.json({ error: 'Failed to purge database fully' }, { status: 500 })
  }
}
