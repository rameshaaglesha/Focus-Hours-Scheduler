import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface StudySession {
  _id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  user_email: string
  user_name: string
}

function generateEmailHtml(
  userName: string,
  sessionTitle: string,
  sessionDescription: string,
  startTime: string,
  endTime: string,
  duration: string
) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Study Session Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0;">
  <div style="background-color: #ffffff; margin: 0 auto; padding: 20px 0 48px; margin-bottom: 64px; max-width: 600px;">
    <div style="padding: 0 48px;">
      <h1 style="color: #333; font-size: 24px; font-weight: bold; margin: 40px 0; padding: 0; text-align: center;">
        🤫 Quiet Hours Reminder
      </h1>
      
      <p style="color: #333; font-size: 16px; line-height: 26px;">Hi ${userName},</p>
      
      <p style="color: #333; font-size: 16px; line-height: 26px;">
        Your focused study session is starting in <strong>10 minutes</strong>!
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <h2 style="color: #1a202c; font-size: 20px; font-weight: bold; margin: 0 0 12px 0;">
          📚 ${sessionTitle}
        </h2>
        
        ${sessionDescription ? `
          <p style="color: #4a5568; font-size: 14px; line-height: 20px; margin: 0 0 16px 0;">
            ${sessionDescription}
          </p>
        ` : ''}
        
        <hr style="border-color: #e2e8f0; margin: 16px 0;" />
        
        <p style="color: #2d3748; font-size: 14px; line-height: 20px; margin: 4px 0;">
          <strong>⏰ Start Time:</strong> ${startTime}
        </p>
        <p style="color: #2d3748; font-size: 14px; line-height: 20px; margin: 4px 0;">
          <strong>⏱️ End Time:</strong> ${endTime}
        </p>
        <p style="color: #2d3748; font-size: 14px; line-height: 20px; margin: 4px 0;">
          <strong>🕒 Duration:</strong> ${duration}
        </p>
      </div>

      <div style="background-color: #ebf8ff; border: 1px solid #bee3f8; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #2b6cb0; font-size: 16px; font-weight: bold; margin: 0 0 12px 0;">💡 Quick Prep Tips:</h3>
        <p style="color: #2c5282; font-size: 14px; line-height: 20px; margin: 4px 0;">• Find a quiet, comfortable study space</p>
        <p style="color: #2c5282; font-size: 14px; line-height: 20px; margin: 4px 0;">• Silence your phone and notifications</p>
        <p style="color: #2c5282; font-size: 14px; line-height: 20px; margin: 4px 0;">• Have your study materials ready</p>
        <p style="color: #2c5282; font-size: 14px; line-height: 20px; margin: 4px 0;">• Take a deep breath and focus</p>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 24px; text-align: center; margin-top: 32px;">
        Good luck with your study session! 🎯
        <br />
        - The Quiet Hours Team
      </p>
    </div>
  </div>
</body>
</html>
  `
}

export async function sendStudyReminder(session: StudySession) {
  try {
    const startTime = new Date(session.start_time)
    const endTime = new Date(session.end_time)
    
    // Format times for display
    const formatTime = (date: Date) => {
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      })
    }
    
    // Calculate duration
    const durationMs = endTime.getTime() - startTime.getTime()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

    // Generate HTML email
    const emailHtml = generateEmailHtml(
      session.user_name,
      session.title,
      session.description || '',
      formatTime(startTime),
      formatTime(endTime),
      duration
    )

    const { data, error } = await resend.emails.send({
      from: 'Quiet Hours <onboarding@resend.dev>', // Use Resend's test domain for now
      to: [session.user_email],
      subject: `🤫 Your study session "${session.title}" starts in 10 minutes!`,
      html: emailHtml,
    })

    if (error) {
      console.error('Error sending email:', error)
      return { success: false, error }
    }

    console.log('Email sent successfully:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('Failed to send study reminder:', error)
    return { success: false, error }
  }
}

export async function sendBulkStudyReminders(sessions: StudySession[]) {
  const results = await Promise.allSettled(
    sessions.map(session => sendStudyReminder(session))
  )
  
  const successful = results.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length
  
  const failed = results.length - successful
  
  console.log(`Bulk email results: ${successful} successful, ${failed} failed out of ${results.length} total`)
  
  return {
    total: results.length,
    successful,
    failed,
    results
  }
}