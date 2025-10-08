import { NextRequest, NextResponse } from 'next/server'
import { getStudyBlocksCollection } from '@/lib/mongodb'
import { sendBulkStudyReminders } from '@/lib/resend-service'
import { createClient } from '@/utils/supabase/server'


// This route will be called by your CRON service (Vercel Cron, GitHub Actions, etc.)
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from your CRON service
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron')
    
    if (!isVercelCron && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes
    const twelveMinutesFromNow = new Date(now.getTime() + 12 * 60 * 1000) // 12 minutes buffer
    
    console.log(`CRON: Checking for sessions between ${tenMinutesFromNow.toISOString()} and ${twelveMinutesFromNow.toISOString()}`)

    const collection = await getStudyBlocksCollection()
    
    // Find sessions that start in 10-12 minutes and haven't been notified
    const sessionsToNotify = await collection
      .find({
        start_time: {
          $gte: tenMinutesFromNow,
          $lte: twelveMinutesFromNow
        },
        status: 'scheduled',
        notification_sent: { $ne: true } // Not sent yet
      })
      .toArray()

    console.log(`CRON: Found ${sessionsToNotify.length} sessions to notify`)

    if (sessionsToNotify.length === 0) {
      return NextResponse.json({ 
        message: 'No sessions to notify',
        checked_window: `${tenMinutesFromNow.toISOString()} to ${twelveMinutesFromNow.toISOString()}`,
        timestamp: now.toISOString()
      })
    }

    // Get user details from Supabase for each session
    const supabase = await createClient()
    const sessionsWithUserData = []

    for (const session of sessionsToNotify) {
      try {
        // Ensure session has an _id before processing (type-safety)
        if (!session._id) {
          console.error(`CRON: Skipping session without _id: ${JSON.stringify(session)}`)
          continue
        }
        // Get user details from Supabase using service role
        const { data: user, error } = await supabase.auth.admin.getUserById(session.user_id)
        
        if (error || !user.user) {
          console.error(`Failed to get user ${session.user_id}:`, error?.message || 'User not found')
          continue
        }

        sessionsWithUserData.push({
          _id: String(session._id),
          title: session.title,
          description: session.description || '',
          start_time: session.start_time.toISOString(),
          end_time: session.end_time.toISOString(),
          user_email: user.user.email!,
          user_name: user.user.email!.split('@')[0], // Use email username as display name
          session_object_id: session._id // Keep for updating
        })
      } catch (error) {
        console.error(`Error processing session ${session._id}:`, error)
      }
    }

    console.log(`CRON: Prepared ${sessionsWithUserData.length} sessions for email sending`)

    if (sessionsWithUserData.length === 0) {
      return NextResponse.json({
        message: 'No valid sessions to notify (users not found)',
        sessions_found: sessionsToNotify.length,
        timestamp: now.toISOString()
      })
    }

    // Send emails
    const emailResults = await sendBulkStudyReminders(sessionsWithUserData)
    
    // Update notification_sent flag for all sessions we attempted to send
    // (Resend will handle delivery, so we mark as sent to avoid duplicates)
    const sessionIdsToUpdate = sessionsWithUserData.map(session => session.session_object_id)

    if (sessionIdsToUpdate.length > 0) {
      const updateResult = await collection.updateMany(
        { _id: { $in: sessionIdsToUpdate } },
        { 
          $set: { 
            notification_sent: true,
            notification_sent_at: new Date()
          }
        }
      )
      console.log(`CRON: Updated ${updateResult.modifiedCount} sessions as notified`)
    }

    const response = {
      success: true,
      message: `CRON job completed`,
      stats: {
        sessions_found: sessionsToNotify.length,
        sessions_processed: sessionsWithUserData.length,
        emails_attempted: emailResults.total,
        emails_successful: emailResults.successful,
        emails_failed: emailResults.failed,
        sessions_updated: sessionIdsToUpdate.length,
        checked_window: `${tenMinutesFromNow.toISOString()} to ${twelveMinutesFromNow.toISOString()}`
      },
      timestamp: now.toISOString()
    }

    console.log('CRON: Job completed:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('CRON: Job failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'CRON job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Optional: Add GET method for manual testing and debugging
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000)
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
    
    const collection = await getStudyBlocksCollection()
    const upcomingSessions = await collection
      .find({
        start_time: { 
          $gte: now,
          $lte: oneHourFromNow 
        },
        status: 'scheduled'
      })
      .sort({ start_time: 1 })
      .limit(10)
      .toArray()

    return NextResponse.json({
      message: 'CRON status check',
      current_time: now.toISOString(),
      ten_minutes_from_now: tenMinutesFromNow.toISOString(),
      upcoming_sessions: upcomingSessions.map(session => ({
        _id: String(session._id),
        title: session.title,
        start_time: session.start_time.toISOString(),
        notification_sent: session.notification_sent || false,
        minutes_until_start: Math.round((session.start_time.getTime() - now.getTime()) / (1000 * 60)),
        user_id: session.user_id
      })),
      total_upcoming: upcomingSessions.length
    })
  } catch (error) {
    console.error('CRON GET failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get CRON status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}