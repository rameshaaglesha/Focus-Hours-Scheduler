import Link from 'next/link'
import React from 'react'

export default function ConfirmSuccessPage({ searchParams }: any) {
  const rawNext = Array.isArray(searchParams?.next) ? searchParams?.next[0] : searchParams?.next
  const next = rawNext && String(rawNext).startsWith('/') ? String(rawNext) : '/dashboard'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Your account is successfully created</h1>
          <p className="mt-4 text-sm text-gray-600">Thank you — your email has been confirmed.</p>
        </div>

        <div className="space-y-2">
          <Link
            href={next}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Continue
          </Link>

          <Link href="/" className="text-sm text-gray-600 hover:text-gray-800 block mt-2">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
