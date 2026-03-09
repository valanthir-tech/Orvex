/**
 * GET /auth/callback
 * 
 * Handles Supabase Auth callbacks:
 * - Email confirmation (signup verification)
 * - Password reset (magic link from email)
 * - Staff invite acceptance (inviteUserByEmail magic link)
 * 
 * Exchanges the auth code for a session, then redirects to the target page.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/'

    if (code) {
        let response = NextResponse.redirect(new URL(next, request.url))

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    },
                    remove(name: string, options: CookieOptions) {
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return response
        }

        console.error('[Auth Callback] Code exchange failed:', error.message)
    }

    // If no code or exchange failed, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
}
