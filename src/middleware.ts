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

    // Role-based protection: Only MANAGERs can access Administration, Leads, and Vaults
    const restrictedPaths = ['/dashboard/staff', '/dashboard/leads', '/dashboard/documents']
    const isRestricted = restrictedPaths.some(path => request.nextUrl.pathname.startsWith(path))
    
    if (isRestricted && payload.role !== 'MANAGER') {
      return NextResponse.redirect(new URL('/dashboard', request.url)) // Bounce back
    }
    
    // Auth success - forward request with no-cache headers to prevent "back button" issues
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return response
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
