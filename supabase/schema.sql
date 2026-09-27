-- Gnana Saraswati Jr. College
-- Production database foundation
-- Run this script in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text,
  city text,
  state text default 'Andhra Pradesh',
  phone text,
  email text,
  website text,
  created_at timestamptz not null default now()
);

create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (college_id, name)
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  duration_years integer not null default 2 check (duration_years > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (college_id, code)
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  name text not null,
  year_level integer not null check (year_level in (1,2)),
  created_at timestamptz not null default now(),
  unique (academic_year_id, course_id, name, year_level)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  college_id uuid references public.colleges(id) on delete restrict,
  full_name text not null,
  role text not null check (role in ('student','faculty','admin','principal')),
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  section_id uuid not null references public.sections(id) on delete restrict,
  admission_number text not null,
  roll_number text,
  date_of_birth date,
  gender text,
  guardian_name text,
  guardian_phone text,
  address text,
  admission_date date,
  status text not null default 'active' check (status in ('active','inactive','passed_out','left')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (college_id, admission_number)
);

create table if not exists public.faculty (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete restrict,
  employee_number text not null,
  designation text,
  department text,
  joining_date date,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  unique (college_id, employee_number)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  code text not null,
  name text not null,
  max_marks integer,
  created_at timestamptz not null default now(),
  unique (course_id, code)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('present','absent','late','excused')),
  marked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, subject_id, attendance_date)
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  name text not null,
  exam_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.marks (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  marks numeric(6,2) not null check (marks >= 0),
  max_marks numeric(6,2) not null check (max_marks > 0),
  entered_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (exam_id, student_id, subject_id)
);

create table if not exists public.timetables (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  faculty_id uuid references public.faculty(id) on delete set null,
  day_of_week integer not null check (day_of_week between 1 and 7),
  start_time time not null,
  end_time time not null,
  room text,
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  faculty_id uuid references public.faculty(id) on delete set null,
  title text not null,
  description text,
  due_date timestamptz,
  attachment_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  fee_type text not null,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date,
  status text not null default 'pending' check (status in ('pending','partial','paid','waived')),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  title text not null,
  body text not null,
  audience text not null default 'all' check (audience in ('all','students','faculty','admin')),
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_students_section on public.students(section_id);
create index if not exists idx_attendance_student_date on public.attendance(student_id, attendance_date);
create index if not exists idx_marks_student on public.marks(student_id);
create index if not exists idx_timetable_section on public.timetables(section_id);
create index if not exists idx_assignments_section on public.assignments(section_id);
create index if not exists idx_fees_student on public.fees(student_id);
create index if not exists idx_notices_college_published on public.notices(college_id, published_at desc);

alter table public.colleges enable row level security;
alter table public.academic_years enable row level security;
alter table public.courses enable row level security;
alter table public.sections enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.faculty enable row level security;
alter table public.subjects enable row level security;
alter table public.attendance enable row level security;
alter table public.exams enable row level security;
alter table public.marks enable row level security;
alter table public.timetables enable row level security;
alter table public.assignments enable row level security;
alter table public.fees enable row level security;
alter table public.notices enable row level security;

-- Helper functions keep policies readable and centralise role checks.
create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select p from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_college_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select college_id from public.profiles where id = auth.uid()
$$;

create policy "profiles_self_select" on public.profiles for select to authenticated
using (id = auth.uid() or college_id = public.current_college_id() and public.current_role() in ('admin','principal'));

create policy "profiles_admin_write" on public.profiles for all to authenticated
using (public.current_role() in ('admin','principal'))
with check (public.current_role() in ('admin','principal'));

create policy "students_self_or_staff_select" on public.students for select to authenticated
using (
  profile_id = auth.uid()
  or (college_id = public.current_college_id() and public.current_role() in ('faculty','admin','principal'))
);

create policy "students_staff_write" on public.students for all to authenticated
using (college_id = public.current_college_id() and public.current_role() in ('admin','principal'))
with check (college_id = public.current_college_id() and public.current_role() in ('admin','principal'));

create policy "faculty_college_select" on public.faculty for select to authenticated
using (college_id = public.current_college_id());

create policy "faculty_admin_write" on public.faculty for all to authenticated
using (college_id = public.current_college_id() and public.current_role() in ('admin','principal'))
with check (college_id = public.current_college_id() and public.current_role() in ('admin','principal'));

create policy "attendance_student_select" on public.attendance for select to authenticated
using (
  exists (
    select 1 from public.students s
    where s.id = attendance.student_id
      and (s.profile_id = auth.uid() or s.college_id = public.current_college_id() and public.current_role() in ('faculty','admin','principal'))
  )
);

create policy "attendance_staff_write" on public.attendance for all to authenticated
using (
  exists (
    select 1 from public.students s
    where s.id = attendance.student_id
      and s.college_id = public.current_college_id()
      and public.current_role() in ('faculty','admin','principal')
  )
)
with check (
  exists (
    select 1 from public.students s
    where s.id = attendance.student_id
      and s.college_id = public.current_college_id()
      and public.current_role() in ('faculty','admin','principal')
  )
);

create policy "marks_student_select" on public.marks for select to authenticated
using (
  exists (
    select 1 from public.students s
    where s.id = marks.student_id
      and (s.profile_id = auth.uid() or s.college_id = public.current_college_id() and public.current_role() in ('faculty','admin','principal'))
  )
);

create policy "marks_staff_write" on public.marks for all to authenticated
using (
  exists (
    select 1 from public.students s
    where s.id = marks.student_id
      and s.college_id = public.current_college_id()
      and public.current_role() in ('faculty','admin','principal')
  )
)
with check (
  exists (
    select 1 from public.students s
    where s.id = marks.student_id
      and s.college_id = public.current_college_id()
      and public.current_role() in ('faculty','admin','principal')
  )
);

create policy "college_data_select" on public.colleges for select to authenticated
using (id = public.current_college_id());

create policy "academic_years_select" on public.academic_years for select to authenticated
using (college_id = public.current_college_id());

create policy "courses_select" on public.courses for select to authenticated
using (college_id = public.current_college_id());

create policy "sections_select" on public.sections for select to authenticated
using (college_id = public.current_college_id());

create policy "subjects_select" on public.subjects for select to authenticated
using (college_id = public.current_college_id());

create policy "exams_select" on public.exams for select to authenticated
using (college_id = public.current_college_id());

create policy "timetables_select" on public.timetables for select to authenticated
using (
  exists (
    select 1 from public.students s
    where s.section_id = timetables.section_id
      and s.profile_id = auth.uid()
  )
  or public.current_role() in ('faculty','admin','principal')
);

create policy "assignments_select" on public.assignments for select to authenticated
using (
  exists (
    select 1 from public.students s
    where s.section_id = assignments.section_id
      and s.profile_id = auth.uid()
  )
  or public.current_role() in ('faculty','admin','principal')
);

create policy "fees_student_select" on public.fees for select to authenticated
using (
  exists (
    select 1 from public.students s
    where s.id = fees.student_id
      and (s.profile_id = auth.uid() or s.college_id = public.current_college_id() and public.current_role() in ('admin','principal'))
  )
);

create policy "notices_college_select" on public.notices for select to authenticated
using (college_id = public.current_college_id() and (audience = 'all' or audience = public.current_role() or public.current_role() in ('admin','principal')));

create policy "notices_admin_write" on public.notices for all to authenticated
using (college_id = public.current_college_id() and public.current_role() in ('admin','principal'))
with check (college_id = public.current_college_id() and public.current_role() in ('admin','principal'));
