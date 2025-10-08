import React from 'react'

interface StudyReminderEmailProps {
  userName: string
  sessionTitle: string
  sessionDescription?: string
  startTime: string
  endTime: string
  duration: string
}

export default function StudyReminderEmail({
  userName,
  sessionTitle,
  sessionDescription,
  startTime,
  endTime,
  duration,
}: StudyReminderEmailProps) {
  return (
    <html>
      <head />
      <body style={main}>
        <div style={container}>
          <div style={box}>
            <h1 style={h1}>🤫 Quiet Hours Reminder</h1>
            
            <p style={text}>Hi {userName},</p>
            
            <p style={text}>
              Your focused study session is starting in <strong>10 minutes</strong>!
            </p>

            <div style={sessionCard}>
              <h2 style={sessionTitleStyle}>
                📚 {sessionTitle}
              </h2>
              
              {sessionDescription && (
                <p style={description}>
                  {sessionDescription}
                </p>
              )}
              
              <hr style={hr} />
              
              <p style={timeInfo}>
                <strong>⏰ Start Time:</strong> {startTime}
              </p>
              <p style={timeInfo}>
                <strong>⏱️ End Time:</strong> {endTime}
              </p>
              <p style={timeInfo}>
                <strong>🕒 Duration:</strong> {duration}
              </p>
            </div>

            <div style={tips}>
              <h3 style={tipsTitle}>💡 Quick Prep Tips:</h3>
              <p style={tip}>• Find a quiet, comfortable study space</p>
              <p style={tip}>• Silence your phone and notifications</p>
              <p style={tip}>• Have your study materials ready</p>
              <p style={tip}>• Take a deep breath and focus</p>
            </div>

            <p style={footer}>
              Good luck with your study session! 🎯
              <br />
              - The Quiet Hours Team
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const box = {
  padding: '0 48px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
}

const sessionCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const sessionTitleStyle = {
  color: '#1a202c',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const description = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px 0',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '16px 0',
}

const timeInfo = {
  color: '#2d3748',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '4px 0',
}

const tips = {
  backgroundColor: '#ebf8ff',
  border: '1px solid #bee3f8',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const tipsTitle = {
  color: '#2b6cb0',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const tip = {
  color: '#2c5282',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '4px 0',
}

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  marginTop: '32px',
}