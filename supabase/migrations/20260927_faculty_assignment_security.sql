-- Faculty assignment security integration
-- Makes faculty_assignments the authoritative source for faculty section/subject access.

create or replace function public.faculty_can_teach(_section_id uuid, _subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.faculty_assignments fa
    join public.faculty f on f.id = fa.faculty_id
    where f.profile_id = auth.uid()
      and f.status = 'active'
      and fa.section_id = _section_id
      and fa.subject_id = _subject_id
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
    from public.faculty_assignments fa
    join public.faculty f on f.id = fa.faculty_id
    where f.profile_id = auth.uid()
      and f.status = 'active'
      and fa.section_id = _section_id
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
    from public.faculty_assignments fa
    join public.faculty f on f.id = fa.faculty_id
    where f.profile_id = auth.uid()
      and f.status = 'active'
      and fa.subject_id = _subject_id
  );
$$;

drop policy if exists faculty_assignments_management_all on public.faculty_assignments;
create policy faculty_assignments_management_all on public.faculty_assignments
for all to authenticated
using (
  public.current_role() in ('admin','principal')
  and college_id = public.current_college_id()
)
with check (
  public.current_role() in ('admin','principal')
  and college_id = public.current_college_id()
  and exists (
    select 1 from public.faculty f
    where f.id = faculty_id
      and f.college_id = public.current_college_id()
  )
  and exists (
    select 1 from public.sections s
    where s.id = section_id
      and s.college_id = public.current_college_id()
  )
  and exists (
    select 1 from public.subjects sub
    where sub.id = subject_id
      and sub.college_id = public.current_college_id()
      and sub.course_id = (select course_id from public.sections where id = section_id)
  )
);
