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
    
    // Auth success - forward request
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
