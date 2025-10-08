import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Accept either `token` or `token_hash` (Supabase may use either in links)
  const token = searchParams.get('token') ?? searchParams.get('token_hash')
  // OTP type: 'signup'|'magiclink'|'recovery' — default to 'signup' if missing
  const type = (searchParams.get('type') as EmailOtpType) ?? ('signup' as EmailOtpType)

  // Sanitize next: only allow internal redirects (start with '/')
  const rawNext = searchParams.get('next') ?? '/'
  const next = rawNext && rawNext.startsWith('/') ? rawNext : '/'

  if (type) {
    const supabase = await createClient()

    try {
      // Call verifyOtp with the exact param shape required by supabase-js (either token or token_hash)
      const tokenParam = searchParams.get('token')
      const tokenHashParam = searchParams.get('token_hash')

      let result: { data: any; error: any } = { data: null, error: null }

      const emailParam = searchParams.get('email')

      if (tokenParam) {
        // supabase-js requires `email` when verifying with a token
        if (!emailParam) {
          return NextResponse.redirect(new URL('/error', request.url))
        }
        result = await supabase.auth.verifyOtp({ type, token: tokenParam, email: emailParam })
      } else if (tokenHashParam) {
        result = await supabase.auth.verifyOtp({ type, token_hash: tokenHashParam })
      } else {
        // no usable token provided
        return NextResponse.redirect(new URL('/error', request.url))
      }

      const { data, error } = result

      if (error) {
        // Redirect to error page with message for debugging
        const msg = encodeURIComponent(error.message || 'Confirmation failed')
        return NextResponse.redirect(new URL(`/error?message=${msg}`, request.url))
      }

      // On success, redirect to a friendly confirmation success page and pass `next` along
      return NextResponse.redirect(new URL(`/auth/confirm/success?next=${encodeURIComponent(next)}`, request.url))
    } catch (err) {
      const msg = encodeURIComponent((err as Error).message || 'Confirmation exception')
      return NextResponse.redirect(new URL(`/error?message=${msg}`, request.url))
    }
  }

  // missing token/type -> error
  return NextResponse.redirect(new URL('/error', request.url))
}