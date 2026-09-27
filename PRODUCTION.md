# Gnana Saraswati Jr. College Portal

Production-oriented college management portal built with Next.js, TypeScript, Tailwind CSS and Supabase.

## Core portals
- Student: attendance, marks, timetable, assignments, fees, notices, profile
- Faculty: assigned students, attendance, marks, assignments, timetable
- Admin: students, faculty, courses, sections, subjects, exams, notices, fees, attendance, marks, timetable, academic years and faculty assignments
- Principal: institution reports and live analytics

## Environment
Set these variables in the deployment platform. Never expose the service-role key to the browser.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The database schema and migrations are under `supabase/`.

## Deployment checklist
1. Apply the schema and every migration in `supabase/migrations/` in order.
2. Configure the three environment variables in the hosting platform.
3. Enable Supabase Email authentication.
4. Create the college, academic year, courses, sections and staff/student accounts.
5. Create faculty assignments before faculty enter attendance, marks or assignments.
6. Verify RLS with student, faculty, admin and principal test accounts.
7. Run the production build in CI/hosting.

Do not commit real credentials or service-role keys.
