import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
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
            cookieOptions: {
                name: 'sb-pos-auth',
            },
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
    const isDemoSession = request.cookies.get('onedexo_demo_session')?.value === 'true'
    let user: any = null

    if (isDemoSession) {
        user = {
            id: 'demo-user',
            email: 'demo@onedexo.com',
        }
    } else {
        try {
            const { data } = await supabase.auth.getUser()
            user = data?.user ?? null
        } catch {
            // Supabase unreachable — allow request through (mock/offline mode)
            return response
        }
    }

    const url = request.nextUrl.clone()

    // 2. Auth Protection Logic
    const isResetPasswordPage = url.pathname === '/reset-password'
    const isAuthCallback = url.pathname === '/auth/callback'
    const isAuthPage = url.pathname.startsWith('/login') || url.pathname.startsWith('/auth') || url.pathname.startsWith('/signup') || url.pathname.startsWith('/forgot-password')
    const isMarketingPage = url.pathname === '/'
    const isProtectedPage = url.pathname.startsWith('/dashboard') ||
        url.pathname.startsWith('/products') ||
        url.pathname.startsWith('/orders') ||
        url.pathname.startsWith('/inventory') ||
        url.pathname.startsWith('/customers') ||
        url.pathname.startsWith('/items') ||
        url.pathname.startsWith('/stock') ||
        url.pathname.startsWith('/reports') ||
        url.pathname.startsWith('/settings') ||
        url.pathname.startsWith('/admin') ||
        url.pathname.startsWith('/payment') ||
        url.pathname.startsWith('/pending') ||
        url.pathname.startsWith('/blocked') ||
        url.pathname.startsWith('/categories') ||
        url.pathname.startsWith('/history') ||
        url.pathname.startsWith('/inbox') ||
        url.pathname.startsWith('/notifications') ||
        url.pathname.startsWith('/sales') ||
        url.pathname.startsWith('/services') ||
        url.pathname.startsWith('/storefront')

    // If authenticated demo/real user visits auth pages, redirect to dashboard
    if (isAuthPage && user) {
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // Redirect unauthenticated users
    if (isProtectedPage && !user) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Demo sessions bypass remote Supabase profile checks
    if (isDemoSession) {
        return response
    }

    // Role guard: superadmin cannot use the POS app — redirect to admin portal
    if (isProtectedPage && user) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
        const adminClient = createClient(supabaseUrl, serviceRoleKey)
        // Optimize: Fetch profile and tenant data in a single joined query
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role, tenant_id, tenants(subscription_status, is_blocked)')
            .eq('id', user.id)
            .single()

        if (profile?.role === 'superadmin') {
            // Sign out from POS and redirect to login with an error
            await supabase.auth.signOut()
            url.pathname = '/login'
            url.searchParams.set('reason', 'superadmin')
            return NextResponse.redirect(url)
        }

        // Subscription & access check for tenant users
        if (profile?.tenant_id) {
            // @ts-ignore - The joined query returns an object or array of objects, we handle both safely
            const tenantObj = Array.isArray(profile.tenants) ? profile.tenants[0] : profile.tenants;
            const isBlocked = tenantObj?.is_blocked;
            const subscriptionStatus = tenantObj?.subscription_status;

            const isPaymentRoute = url.pathname.startsWith('/payment')
            const isBlockedRoute = url.pathname.startsWith('/blocked')
            const isLogoutRoute = url.pathname.startsWith('/logout')
            const isPendingRoute = url.pathname.startsWith('/pending')
            const isExempt = isPaymentRoute || isBlockedRoute || isLogoutRoute || isPendingRoute

            // Hard block: account fully suspended
            if (isBlocked && !isExempt) {
                url.pathname = '/blocked'
                url.search = ''
                return NextResponse.redirect(url)
            }

            // Pending payment: redirect to payment page
            if (subscriptionStatus === 'pending_payment' && !isExempt) {
                url.pathname = '/payment'
                url.search = ''
                return NextResponse.redirect(url)
            }

            // Waiting approval: redirect to pending page
            if (subscriptionStatus === 'waiting_approval' && !isExempt) {
                if (!isPendingRoute) {
                    url.pathname = '/pending'
                    url.search = ''
                    return NextResponse.redirect(url)
                }
            } else if (subscriptionStatus !== 'waiting_approval' && isPendingRoute) {
                // Not waiting approval, but trying to hit pending route
                url.pathname = '/dashboard'
                url.search = ''
                return NextResponse.redirect(url)
            }

            // Past due on payment route: redirect to dashboard (they have grace period)
            if (isPaymentRoute && subscriptionStatus === 'active') {
                url.pathname = '/dashboard'
                url.search = ''
                return NextResponse.redirect(url)
            }
        }
    }

    // Redirect authenticated users away from login or marketing page
    // But allow reset-password page (user has a session from the email link)
    // and auth callback (exchange code for session)
    if ((isAuthPage || isMarketingPage) && user && !isResetPasswordPage && !isAuthCallback) {
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
