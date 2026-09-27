-- Faculty section/subject assignments
create table if not exists public.faculty_assignments (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  faculty_id uuid not null references public.faculty(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (faculty_id, section_id, subject_id)
);

create index if not exists faculty_assignments_faculty_idx on public.faculty_assignments(faculty_id);
create index if not exists faculty_assignments_section_idx on public.faculty_assignments(section_id);
create index if not exists faculty_assignments_subject_idx on public.faculty_assignments(subject_id);

alter table public.faculty_assignments enable row level security;

drop policy if exists faculty_assignments_management_all on public.faculty_assignments;
create policy faculty_assignments_management_all on public.faculty_assignments
for all to authenticated
using (public.current_role() in ('admin','principal') and college_id = public.current_college_id())
with check (public.current_role() in ('admin','principal') and college_id = public.current_college_id());

drop policy if exists faculty_assignments_faculty_select on public.faculty_assignments;
create policy faculty_assignments_faculty_select on public.faculty_assignments
for select to authenticated
using (
  college_id = public.current_college_id()
  and faculty_id in (select id from public.faculty where profile_id = auth.uid())
);

drop policy if exists faculty_assignments_student_select on public.faculty_assignments;
create policy faculty_assignments_student_select on public.faculty_assignments
for select to authenticated
using (
  college_id = public.current_college_id()
  and section_id in (select section_id from public.students where profile_id = auth.uid())
);
