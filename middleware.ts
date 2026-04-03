import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  // Protected routes
  const dashboardRoutes = ['/dashboard', '/scores', '/charity', '/draws']
  const adminRoutes = ['/admin']
  const authRoutes = ['/login', '/signup']

  const isDashboard = dashboardRoutes.some(r => pathname.startsWith(r))
  const isAdmin = adminRoutes.some(r => pathname.startsWith(r))
  const isAuth = authRoutes.some(r => pathname.startsWith(r))

  if ((isDashboard || isAdmin) && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuth && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isAdmin && session) {
    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/scores/:path*', '/charity/:path*',
            '/draws/:path*', '/admin/:path*', '/login', '/signup'],
}
