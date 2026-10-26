create table public.student_religion_subject_overrides (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete restrict,
  class_id uuid not null,
  semester_id uuid not null,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_religion_subject_overrides_membership_fkey
    foreign key (student_id, class_id, semester_id)
    references public.class_members (student_id, class_id, semester_id)
    on delete restrict,
  constraint student_religion_subject_overrides_student_semester_unique
    unique (student_id, semester_id)
);

create index student_religion_subject_overrides_class_semester_idx
on public.student_religion_subject_overrides (class_id, semester_id);

create index student_religion_subject_overrides_subject_id_idx
on public.student_religion_subject_overrides (subject_id);

create index student_religion_subject_overrides_created_by_idx
on public.student_religion_subject_overrides (created_by);

create index student_religion_subject_overrides_updated_by_idx
on public.student_religion_subject_overrides (updated_by);

comment on table public.student_religion_subject_overrides is
  'Optional per-semester replacement for automatic religion subject grouping. Student biodata religion remains unchanged.';

create trigger student_religion_subject_overrides_set_updated_at
before update on public.student_religion_subject_overrides
for each row execute function private.set_updated_at();

create function private.validate_student_religion_subject_override()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  selected_scope text;
  student_scope text;
begin
  if tg_op = 'DELETE' then
    select religion_scope
    into selected_scope
    from public.subjects
    where id = old.subject_id;

    select private.normalize_religion(religion)
    into student_scope
    from public.students
    where id = old.student_id;

    if selected_scope is distinct from student_scope
      and (
        exists (
          select 1
          from public.grade_entries
          where student_id = old.student_id
            and semester_id = old.semester_id
            and subject_id = old.subject_id
        )
        or exists (
          select 1
          from public.report_descriptions
          where student_id = old.student_id
            and semester_id = old.semester_id
            and subject_id = old.subject_id
        )
      )
    then
      raise exception using
        errcode = '23514',
        message = 'Religion subject replacement cannot be removed after grades or descriptions exist.';
    end if;

    return old;
  end if;

  select religion_scope
  into selected_scope
  from public.subjects
  where id = new.subject_id;

  if selected_scope is null then
    raise exception using
      errcode = '23514',
      message = 'Manual religion subject replacement requires a religion-scoped subject.';
  end if;

  if exists (
    select 1
    from public.grade_entries
    join public.subjects on subjects.id = grade_entries.subject_id
    where grade_entries.student_id = new.student_id
      and grade_entries.semester_id = new.semester_id
      and grade_entries.subject_id <> new.subject_id
      and subjects.religion_scope is not null
  ) or exists (
    select 1
    from public.report_descriptions
    join public.subjects on subjects.id = report_descriptions.subject_id
    where report_descriptions.student_id = new.student_id
      and report_descriptions.semester_id = new.semester_id
      and report_descriptions.subject_id <> new.subject_id
      and subjects.religion_scope is not null
  ) then
    raise exception using
      errcode = '23514',
      message = 'Religion subject replacement must be set before grades or descriptions are entered.';
  end if;

  return new;
end
$$;

revoke all on function private.validate_student_religion_subject_override()
from public, anon, authenticated;

create trigger student_religion_subject_overrides_validate
before insert or update of subject_id
on public.student_religion_subject_overrides
for each row execute function private.validate_student_religion_subject_override();

create trigger student_religion_subject_overrides_validate_delete
before delete on public.student_religion_subject_overrides
for each row execute function private.validate_student_religion_subject_override();

alter table public.student_religion_subject_overrides enable row level security;

revoke all on table public.student_religion_subject_overrides
from anon, authenticated;

grant select on table public.student_religion_subject_overrides
to authenticated;

grant insert (
  student_id,
  class_id,
  semester_id,
  subject_id,
  created_by,
  updated_by
) on public.student_religion_subject_overrides to authenticated;

grant update (subject_id, updated_by)
on public.student_religion_subject_overrides to authenticated;

grant delete on table public.student_religion_subject_overrides
to authenticated;

create policy student_religion_subject_overrides_authorized_select
on public.student_religion_subject_overrides
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or exists (
          select 1
          from public.teacher_profiles
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
            and (
              exists (
                select 1
                from public.classes
                where classes.id = student_religion_subject_overrides.class_id
                  and classes.semester_id = student_religion_subject_overrides.semester_id
                  and classes.homeroom_teacher_id = teacher_profiles.id
              )
              or exists (
                select 1
                from public.teacher_assignments
                where teacher_assignments.teacher_id = teacher_profiles.id
                  and teacher_assignments.class_id = student_religion_subject_overrides.class_id
                  and teacher_assignments.semester_id = student_religion_subject_overrides.semester_id
                  and teacher_assignments.is_active
              )
            )
        )
      )
  )
);

create policy student_religion_subject_overrides_authorized_insert
on public.student_religion_subject_overrides
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1
            from public.classes
            join public.teacher_profiles
              on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = student_religion_subject_overrides.class_id
              and classes.semester_id = student_religion_subject_overrides.semester_id
          )
        )
      )
  )
);

create policy student_religion_subject_overrides_authorized_update
on public.student_religion_subject_overrides
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1
            from public.classes
            join public.teacher_profiles
              on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = student_religion_subject_overrides.class_id
              and classes.semester_id = student_religion_subject_overrides.semester_id
          )
        )
      )
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1
            from public.classes
            join public.teacher_profiles
              on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = student_religion_subject_overrides.class_id
              and classes.semester_id = student_religion_subject_overrides.semester_id
          )
        )
      )
  )
);

create policy student_religion_subject_overrides_authorized_delete
on public.student_religion_subject_overrides
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1
            from public.classes
            join public.teacher_profiles
              on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = student_religion_subject_overrides.class_id
              and classes.semester_id = student_religion_subject_overrides.semester_id
          )
        )
      )
  )
);

create or replace function private.enforce_student_subject_religion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_religion text;
  student_religion text;
  override_subject_id uuid;
begin
  select religion_scope
  into expected_religion
  from public.subjects
  where id = new.subject_id;

  if expected_religion is null then
    return new;
  end if;

  select subject_id
  into override_subject_id
  from public.student_religion_subject_overrides
  where student_id = new.student_id
    and semester_id = new.semester_id;

  if override_subject_id is not null then
    if override_subject_id = new.subject_id then
      return new;
    end if;

    raise exception using
      errcode = '23514',
      message = 'Student religion subject does not match the manual replacement.';
  end if;

  select private.normalize_religion(religion)
  into student_religion
  from public.students
  where id = new.student_id;

  if student_religion is distinct from expected_religion then
    raise exception using
      errcode = '23514',
      message = 'Student religion does not match subject religion scope.';
  end if;

  return new;
end
$$;

revoke all on function private.enforce_student_subject_religion()
from public, anon, authenticated;
