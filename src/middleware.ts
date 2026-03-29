import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  
  // Protect /dashboard and sub-routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    // Verify valid JWT token
    const payload = await decrypt(token)
    if (!payload) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Role-based protection: Only MANAGERs can access /dashboard/staff
    if (request.nextUrl.pathname.startsWith('/dashboard/staff') && payload.role !== 'MANAGER') {
      return NextResponse.redirect(new URL('/dashboard', request.url)) // Bounce back
    }
    
    // Auth success - forward request
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
