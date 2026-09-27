-- Faculty RLS hardening
-- Run this migration in the Supabase SQL Editor before production use.

create or replace function public.faculty_can_teach(_section_id uuid, _subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.timetables t
    join public.faculty f on f.id = t.faculty_id
    where f.profile_id = auth.uid()
      and f.status = 'active'
      and t.section_id = _section_id
      and t.subject_id = _subject_id
  );
$$;

create or replace function public.faculty_has_section(_section_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.timetables t
    join public.faculty f on f.id = t.faculty_id
    where f.profile_id = auth.uid()
      and f.status = 'active'
      and t.section_id = _section_id
  );
$$;

create or replace function public.faculty_has_subject(_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.timetables t
    join public.faculty f on f.id = t.faculty_id
    where f.profile_id = auth.uid()
      and f.status = 'active'
      and t.subject_id = _subject_id
  );
$$;

drop policy if exists "faculty_college_select" on public.faculty;
create policy "faculty_self_or_management_select"
on public.faculty for select to authenticated
using (
  profile_id = auth.uid()
  or (
    college_id = public.current_college_id()
    and public.current_role() in ('admin','principal')
  )
);

drop policy if exists "sections_select" on public.sections;
create policy "sections_role_scoped_select"
on public.sections for select to authenticated
using (
  (
    public.current_role() = 'faculty'
    and public.faculty_has_section(id)
  )
  or (
    public.current_role() in ('admin','principal')
    and college_id = public.current_college_id()
  )
  or exists (
    select 1 from public.students s
    where s.section_id = sections.id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists "subjects_select" on public.subjects;
create policy "subjects_role_scoped_select"
on public.subjects for select to authenticated
using (
  (
    public.current_role() = 'faculty'
    and public.faculty_has_subject(id)
  )
  or (
    public.current_role() in ('admin','principal')
    and college_id = public.current_college_id()
  )
  or exists (
    select 1
    from public.students s
    join public.sections sec on sec.id = s.section_id
    where s.profile_id = auth.uid()
      and sec.course_id = subjects.course_id
  )
);

drop policy if exists "timetables_select" on public.timetables;
create policy "timetables_role_scoped_select"
on public.timetables for select to authenticated
using (
  (
    public.current_role() = 'faculty'
    and exists (
      select 1
      from public.faculty f
      where f.id = timetables.faculty_id
        and f.profile_id = auth.uid()
    )
  )
  or (
    public.current_role() in ('admin','principal')
    and exists (
      select 1 from public.sections s
      where s.id = timetables.section_id
        and s.college_id = public.current_college_id()
    )
  )
  or exists (
    select 1 from public.students s
    where s.section_id = timetables.section_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists "assignments_select" on public.assignments;
create policy "assignments_role_scoped_select"
on public.assignments for select to authenticated
using (
  (
    public.current_role() = 'faculty'
    and faculty_id = (select id from public.faculty where profile_id = auth.uid())
  )
  or (
    public.current_role() in ('admin','principal')
    and exists (
      select 1 from public.sections s
      where s.id = assignments.section_id
        and s.college_id = public.current_college_id()
    )
  )
  or exists (
    select 1 from public.students s
    where s.section_id = assignments.section_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists "attendance_student_select" on public.attendance;
create policy "attendance_role_scoped_select"
on public.attendance for select to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = attendance.student_id
      and (
        s.profile_id = auth.uid()
        or (
          public.current_role() = 'faculty'
          and public.faculty_can_teach(s.section_id, attendance.subject_id)
        )
        or (
          public.current_role() in ('admin','principal')
          and s.college_id = public.current_college_id()
        )
      )
  )
);

drop policy if exists "attendance_staff_write" on public.attendance;
create policy "attendance_role_scoped_write"
on public.attendance for all to authenticated
using (
  (
    public.current_role() in ('admin','principal')
    and exists (
      select 1 from public.students s
      where s.id = attendance.student_id
        and s.college_id = public.current_college_id()
    )
  )
  or (
    public.current_role() = 'faculty'
    and attendance.marked_by = auth.uid()
    and exists (
      select 1 from public.students s
      where s.id = attendance.student_id
        and public.faculty_can_teach(s.section_id, attendance.subject_id)
    )
  )
)
with check (
  (
    public.current_role() in ('admin','principal')
    and exists (
      select 1 from public.students s
      where s.id = attendance.student_id
        and s.college_id = public.current_college_id()
    )
  )
  or (
    public.current_role() = 'faculty'
    and marked_by = auth.uid()
    and exists (
      select 1 from public.students s
      where s.id = attendance.student_id
        and public.faculty_can_teach(s.section_id, subject_id)
    )
  )
);

drop policy if exists "marks_student_select" on public.marks;
create policy "marks_role_scoped_select"
on public.marks for select to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = marks.student_id
      and (
        s.profile_id = auth.uid()
        or (
          public.current_role() = 'faculty'
          and public.faculty_can_teach(s.section_id, marks.subject_id)
        )
        or (
          public.current_role() in ('admin','principal')
          and s.college_id = public.current_college_id()
        )
      )
  )
);

drop policy if exists "marks_staff_write" on public.marks;
create policy "marks_role_scoped_write"
on public.marks for all to authenticated
using (
  (
    public.current_role() in ('admin','principal')
    and exists (
      select 1 from public.students s
      where s.id = marks.student_id
        and s.college_id = public.current_college_id()
    )
  )
  or (
    public.current_role() = 'faculty'
    and entered_by = auth.uid()
    and exists (
      select 1 from public.students s
      where s.id = marks.student_id
        and public.faculty_can_teach(s.section_id, marks.subject_id)
    )
  )
)
with check (
  (
    public.current_role() in ('admin','principal')
    and exists (
      select 1 from public.students s
      where s.id = marks.student_id
        and s.college_id = public.current_college_id()
    )
  )
  or (
    public.current_role() = 'faculty'
    and entered_by = auth.uid()
    and exists (
      select 1 from public.students s
      where s.id = marks.student_id
        and public.faculty_can_teach(s.section_id, subject_id)
    )
  )
);

drop policy if exists "assignments_admin_write" on public.assignments;
create policy "assignments_role_scoped_write"
on public.assignments for all to authenticated
using (
  (
    public.current_role() in ('admin','principal')
    and exists (
      select 1 from public.sections s
      where s.id = assignments.section_id
        and s.college_id = public.current_college_id()
    )
  )
  or (
    public.current_role() = 'faculty'
    and faculty_id = (select id from public.faculty where profile_id = auth.uid())
    and public.faculty_can_teach(section_id, subject_id)
  )
)
with check (
  (
    public.current_role() in ('admin','principal')
    and exists (
      select 1 from public.sections s
      where s.id = assignments.section_id
        and s.college_id = public.current_college_id()
    )
  )
  or (
    public.current_role() = 'faculty'
    and faculty_id = (select id from public.faculty where profile_id = auth.uid())
    and public.faculty_can_teach(section_id, subject_id)
  )
);
