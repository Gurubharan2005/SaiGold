import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    const leadsCount = await prisma.customer.count()
    return NextResponse.json({ 
      status: 'Database Online', 
      users: userCount, 
      leads: leadsCount,
      environment: process.env.NODE_ENV
    })
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'Database Offline', 
      error: error.message 
    }, { status: 500 })
  }
}
