import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    // ── Mock/UI-first mode: skip all Supabase auth ──
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
    if (isMockMode || !supabaseUrl || !supabaseKey) {
        return NextResponse.next()
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create Supabase client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    // Updates cookie on request (server)
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    // Updates cookie on response (client)
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // 1. Refresh Session (Critical for SSR)
    let user = null
    try {
        const { data } = await supabase.auth.getUser()
        user = data?.user ?? null
    } catch {
        // Supabase unreachable — allow request through (mock/offline mode)
        return response
    }

    const url = request.nextUrl.clone()

    // 2. Auth Protection Logic
    const isAuthPage = url.pathname.startsWith('/login') || url.pathname.startsWith('/auth')
    const isProtectedPage = url.pathname.startsWith('/dashboard') ||
        url.pathname.startsWith('/pos') ||
        url.pathname.startsWith('/items') ||
        url.pathname.startsWith('/settings') ||
        url.pathname.startsWith('/admin')

    // Redirect unauthenticated users
    if (isProtectedPage && !user) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from login
    if (isAuthPage && user) {
        // Simple redirect - role check is done inside the dashboard layout anyway
        // Checking DB in middleware can be slow, so we do a "best guess" or just default to dashboard
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // 3. Kill Switch Logic (Optional Optimization: Do this only on critical mutations or Dashboard load if too slow here)
    // For MVP, lets keep middleware fast and handle deep role checks in Layout/Pages.
    // We rely on RLS policies to prevent data access anyway.

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (API routes can handle their own 401s)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
