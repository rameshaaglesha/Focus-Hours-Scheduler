import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Quiet Hours Scheduler
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Schedule focused study sessions and never miss a reminder again
        </p>
        
        <div className="space-x-4">
          <Link 
            href="/login"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link 
            href="/signup"
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-indigo-600"
          >
            Get Started
          </Link>
        </div>
        
        <div className="mt-12 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Schedule Sessions</h3>
            <p className="text-gray-600">Create focused study blocks with custom times and descriptions</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Email Reminders</h3>
            <p className="text-gray-600">Get notified 10 minutes before your study session starts</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">No Conflicts</h3>
            <p className="text-gray-600">Automatically prevents overlapping study sessions</p>
          </div>
        </div>
      </div>
    </div>
  )
}
