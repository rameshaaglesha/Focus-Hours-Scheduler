// Quick test for Supabase signUp / signIn using project env vars
// Run: node scripts/test-supabase-auth.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const testEmail = process.env.TEST_EMAIL || `dev.test.${Date.now()}@example.com`

if (!url || !anon) {
  console.error('Supabase URL or anon key missing in .env.local')
  process.exit(1)
}

const supabase = createClient(url, anon)

async function run() {
  try {
    console.log('Attempting signUp with', testEmail)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'password123'
    })

    if (signUpError) {
      console.error('signUp error full:', signUpError)
    } else {
      console.log('signUp ok:', signUpData)
    }

    console.log('Attempting signIn with', testEmail)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'password123'
    })

    if (signInError) {
      console.error('signIn error full:', signInError)
    } else {
      console.log('signIn ok:', signInData)
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

run()
