'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: result, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Login error:', error)
    return { success: false, error: error.message || 'Login failed' }
  }

  try {
    revalidatePath('/')
  } catch {
    // ignore
  }

  return { success: true }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL ?
    (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`) :
    'http://localhost:3000'

  const { data: authData, error } = await supabase.auth.signUp({
    ...data,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm`
    }
  })

  if (process.env.DEV_AUTO_CONFIRM === '1' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = await import('@/utils/supabase/server').then(m => m.createClient())
      const { data: adminData, error: adminError } = await adminClient.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      } as any)

      if (adminError) {
        console.error('DEV_AUTO_CONFIRM admin.createUser error:', adminError)
      } else {
        return { success: true }
      }
    } catch (err) {
      console.error('DEV_AUTO_CONFIRM failed:', err)
    }
  }

  if (error) {
    console.error('Signup error:', error)
    return { success: false, error: error.message || 'Signup failed' }
  }

  try {
    revalidatePath('/')
  } catch {
    // ignore
  }

  if (authData.user && !authData.user.email_confirmed_at) {
    return { success: true, needsConfirmation: true }
  }

  return { success: true }
}