# Quiet Hours Scheduler

Quiet Hours is a study session management app that helps students schedule focused work periods and receive reminder emails before sessions start.

---

## Key Features  

- **Secure Authentication** – Complete user registration and login system (Supabase)  
- **Smart Scheduling** – Create, edit, and delete study sessions with time conflict detection  
- **Automated Reminders** – Receive beautiful email notifications 10 minutes before sessions (Resend)  
- **CRON-driven Reminder Job** – Automated email scheduling with Vercel Cron
- **Session Analytics** – Track active, upcoming, and completed study sessions  
- **Responsive Design** – Works perfectly on desktop, tablet, and mobile devices  
- **Real-time Updates** – Live session status updates and notifications  
- **Modern UI** – Clean, intuitive interface built with Tailwind CSS  

---

## Built With  

### **Frontend**  
- [Next.js 15] – React framework with App Router   
- [TypeScript] – Type safety and developer experience  
- [Tailwind CSS] – Utility-first CSS framework  

### **Backend & Database**  
- [Supabase] – Authentication and user management  
- [MongoDB Atlas] – NoSQL database for session storage  


### **Email & Automation**  
- [Resend] – Email delivery service  
- [Vercel Cron] – Automated email scheduling  

---

## Run & Build

### Prerequisites
- Node.js 18+ and npm

### Environment
Create a `.env.local` in the project root with the following (examples / placeholders):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MONGODB_URI=mongodb://localhost:27017/quiet-hours-scheduler
RESEND_API_KEY=re_yourkey
CRON_SECRET=your_cron_secret
```

- If `MONGODB_URI` is not provided or a connection cannot be established, the app automatically falls back to an in-memory collection for development so the dev server and API routes still work. For production, provide a real MongoDB connection string.
- `RESEND_API_KEY` can be a placeholder to allow builds; real email sending requires a valid key.

### Development

```powershell
npm install
npm run dev
```

### Build

```powershell
npm run build
```

---

## Notes & Troubleshooting
- If you see build-time errors complaining about missing environment variables (e.g. MongoDB URI or Resend key), add them to `.env.local`.
- Local dev: you can run a MongoDB instance (Docker or local install) and set `MONGODB_URI` to avoid the in-memory fallback.

---

## Next Steps (Optional)
- Add a Docker Compose file to run MongoDB locally for development.
- Add integration tests for API routes.

If you'd like, I can add Docker Compose and a small script to seed example data locally.

## Development auto-confirm (convenience)

If you want to skip email confirmation while developing you can enable an environment flag to auto-create and auto-confirm users on signup:

```
DEV_AUTO_CONFIRM=1
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

When `DEV_AUTO_CONFIRM=1` and a `SUPABASE_SERVICE_ROLE_KEY` is present, the server signup action will create the user using the Supabase Admin API and mark the email as confirmed. Only use this locally — do NOT enable in production.

