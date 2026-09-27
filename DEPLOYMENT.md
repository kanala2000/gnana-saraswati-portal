# Gnana Saraswati Jr. College Portal — Production Deployment

## Required environment variables

Set these in the hosting provider's production environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only; never expose it to the browser.

## Supabase

Before first production login:

1. Apply `supabase/schema.sql`.
2. Apply all files under `supabase/migrations/` in order.
3. Apply the notifications SQL migration.
4. Configure Supabase Auth email/password settings.
5. Create the college, academic year, courses, sections, subjects and management accounts.
6. Create student/faculty accounts through the production admin workflow.
7. Create faculty assignments before faculty users enter attendance, marks or assignments.
8. Verify RLS policies before opening the portal to real users.

## Hosting

Use a Next.js-compatible host such as Vercel or another Node-compatible platform.

Build command: `npm run build`

Start command for a Node server: `npm start`

For Vercel, connect the GitHub repository and set production environment variables. Deploy from `main` after the GitHub production-build workflow passes.

## Security

- Never commit `.env.local`, service-role keys, passwords or user credentials.
- The Supabase publishable/anon key may be used by the browser; RLS is the security boundary.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Use HTTPS in production.
- Remove test accounts before launch.
- Review inactive accounts during academic-year rollover.
- Keep regular Supabase backups and test recovery procedures.

## Launch checklist

- [ ] Production domain connected
- [ ] HTTPS active
- [ ] Production Supabase variables configured
- [ ] Service-role key configured server-side
- [ ] Database schema/migrations applied
- [ ] Notifications table and policies applied
- [ ] Admin/principal login tested
- [ ] Student login tested
- [ ] Faculty login tested
- [ ] Password reset tested
- [ ] Attendance tested
- [ ] Marks tested
- [ ] Fees tested
- [ ] Timetable tested
- [ ] Assignments tested
- [ ] Notices tested
- [ ] Notifications tested
- [ ] ID card/report card/fee statement print tested
- [ ] Mobile layout checked
- [ ] Production build passing
