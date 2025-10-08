'use client'

import { format } from 'date-fns'
import Link from 'next/link'

interface StudyBlock {
  _id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  notification_sent: boolean
  status: string
}

interface StudyBlockCardProps {
  block: StudyBlock
  status: 'active' | 'upcoming' | 'completed'
}

export default function StudyBlockCard({ block, status }: StudyBlockCardProps) {
  const startTime = new Date(block.start_time)
  const endTime = new Date(block.end_time)
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) // minutes

  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const statusIcons = {
    active: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check-icon lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>,

    upcoming: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock2-icon lucide-clock-2"><path d="M12 6v6l4-2"/><circle cx="12" cy="12" r="10"/></svg>,

    completed: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" stroke-linecap="round" strokeLinejoin="round" className="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>,
  }

  return (
    <div className={`border rounded-lg p-4 ${statusColors[status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{statusIcons[status]}</span>
            <h3 className="font-medium text-gray-900">{block.title}</h3>
            <span className="text-xs px-2 py-1 bg-white rounded-full">
              {duration} min
            </span>
          </div>
          
          {block.description && (
            <p className="text-sm text-gray-600 mb-2">{block.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              {format(startTime, 'MMM dd, yyyy')}
            </span>
            <span>
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </span>
            {block.notification_sent && (
              <span className="text-green-600">✉️ Reminder sent</span>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        {status !== 'completed' && (
          <div className="ml-4 flex gap-2">
            <Link
              href={`/dashboard/edit/${block._id}`}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3 py-1 border border-indigo-200 rounded-md hover:bg-indigo-50"
            >
              Edit
            </Link>
          </div>
        )}
        
        {/* Show view-only for completed */}
        {status === 'completed' && (
          <div className="ml-4">
            <span className="text-gray-500 text-sm">
               Completed
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
