import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        status: { not: 'WAITING' },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        goldWeight: true,
        loanAmount: true,
        branch: true,
        createdAt: true,
      }
    })

    const flattenedData = customers.map((c: any) => ({
      'Customer ID': c.id,
      'Name': c.name,
      'Phone': c.phone,
      'Status': c.status,
      'Gold Weight (g)': c.goldWeight || 'N/A',
      'Loan Amount (INR)': c.loanAmount || 'N/A',
      'Branch': c.branch || 'Headquarters',
      'Joined Date': format(new Date(c.createdAt), 'yyyy-MM-dd HH:mm'),
    }))

    const worksheet = XLSX.utils.json_to_sheet(flattenedData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers')

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="SaiGoldLoans_Customers_${format(new Date(), 'yyyyMMdd')}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })
  } catch (error) {
    console.error('Export Error:', error)
    return NextResponse.json({ error: 'Failed to export customer data' }, { status: 500 })
  }
}
