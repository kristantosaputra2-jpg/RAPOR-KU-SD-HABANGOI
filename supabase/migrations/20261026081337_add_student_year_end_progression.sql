create table public.student_year_end_actions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete restrict,
  source_class_id uuid not null,
  source_semester_id uuid not null,
  action text not null,
  target_class_id uuid,
  target_semester_id uuid,
  processed_by uuid not null references auth.users (id) on delete restrict,
  processed_at timestamptz not null default now(),
  constraint student_year_end_actions_source_class_fkey
    foreign key (source_class_id, source_semester_id)
    references public.classes (id, semester_id)
    on delete restrict,
  constraint student_year_end_actions_target_class_fkey
    foreign key (target_class_id, target_semester_id)
    references public.classes (id, semester_id)
    on delete restrict,
  constraint student_year_end_actions_student_source_unique
    unique (student_id, source_semester_id),
  constraint student_year_end_actions_action_valid
    check (action in ('promoted', 'graduated')),
  constraint student_year_end_actions_target_valid
    check (
      (
        action = 'promoted'
        and target_class_id is not null
        and target_semester_id is not null
      )
      or (
        action = 'graduated'
        and target_class_id is null
        and target_semester_id is null
      )
    )
);

create index student_year_end_actions_source_class_idx
on public.student_year_end_actions (source_class_id);

create index student_year_end_actions_target_class_idx
on public.student_year_end_actions (target_class_id)
where target_class_id is not null;

create index student_year_end_actions_processed_by_idx
on public.student_year_end_actions (processed_by);

comment on table public.student_year_end_actions is
  'Immutable audit trail for promotion and graduation without deleting historical student data.';

alter table public.student_year_end_actions enable row level security;

revoke all on table public.student_year_end_actions from anon, authenticated;
grant select, insert on table public.student_year_end_actions to authenticated;

create policy student_year_end_actions_admin_select
on public.student_year_end_actions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
);

create policy student_year_end_actions_admin_insert
on public.student_year_end_actions
for insert
to authenticated
with check (
  processed_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
);

create function public.process_student_year_end(
  p_source_class_id uuid,
  p_student_ids uuid[],
  p_target_class_id uuid default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_source record;
  v_target record;
  v_student_count integer;
  v_unique_student_count integer;
begin
  if v_user_id is null or not exists (
    select 1
    from public.profiles
    where profiles.id = v_user_id
      and profiles.role = 'admin'
      and profiles.is_active
  ) then
    raise exception 'Only an active admin can process year-end students.'
      using errcode = '42501';
  end if;

  if coalesce(cardinality(p_student_ids), 0) = 0 then
    raise exception 'Select at least one student.'
      using errcode = '23514';
  end if;

  select count(*)
  into v_unique_student_count
  from (
    select distinct student_id
    from unnest(p_student_ids) as selected_students(student_id)
  ) as unique_students;

  if v_unique_student_count <> cardinality(p_student_ids) then
    raise exception 'A student may only be selected once.'
      using errcode = '23514';
  end if;

  select
    classes.id,
    classes.grade_level,
    classes.semester_id,
    classes.academic_year_id,
    semesters.number as semester_number,
    academic_years.name as academic_year_name
  into v_source
  from public.classes
  join public.semesters
    on semesters.id = classes.semester_id
  join public.academic_years
    on academic_years.id = classes.academic_year_id
  where classes.id = p_source_class_id;

  if v_source.id is null then
    raise exception 'Source class not found.'
      using errcode = 'P0002';
  end if;

  if v_source.semester_number <> 2 then
    raise exception 'Year-end processing is only available for semester 2.'
      using errcode = '23514';
  end if;

  select count(*)
  into v_student_count
  from public.class_members
  join public.students
    on students.id = class_members.student_id
  where class_members.class_id = v_source.id
    and class_members.semester_id = v_source.semester_id
    and class_members.student_id = any(p_student_ids)
    and students.is_active;

  if v_student_count <> cardinality(p_student_ids) then
    raise exception 'Every selected student must be active and belong to the source class.'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.student_year_end_actions
    where student_year_end_actions.source_semester_id = v_source.semester_id
      and student_year_end_actions.student_id = any(p_student_ids)
  ) then
    raise exception 'One or more students have already been processed for this semester.'
      using errcode = '23505';
  end if;

  if v_source.grade_level < 6 then
    if p_target_class_id is null then
      raise exception 'A target class is required for promotion.'
        using errcode = '23514';
    end if;

    select
      classes.id,
      classes.grade_level,
      classes.semester_id,
      classes.academic_year_id,
      semesters.number as semester_number,
      academic_years.name as academic_year_name
    into v_target
    from public.classes
    join public.semesters
      on semesters.id = classes.semester_id
    join public.academic_years
      on academic_years.id = classes.academic_year_id
    where classes.id = p_target_class_id;

    if v_target.id is null then
      raise exception 'Target class not found.'
        using errcode = 'P0002';
    end if;

    if v_target.semester_number <> 1
      or v_target.grade_level <> v_source.grade_level + 1
      or split_part(v_target.academic_year_name, '/', 1)::integer
        <> split_part(v_source.academic_year_name, '/', 2)::integer
      or split_part(v_target.academic_year_name, '/', 2)::integer
        <> split_part(v_source.academic_year_name, '/', 2)::integer + 1
    then
      raise exception 'Target class must be the next grade in semester 1 of the following academic year.'
        using errcode = '23514';
    end if;

    if exists (
      select 1
      from public.class_members
      where class_members.semester_id = v_target.semester_id
        and class_members.student_id = any(p_student_ids)
    ) then
      raise exception 'One or more students already have a class in the target semester.'
        using errcode = '23505';
    end if;

    insert into public.class_members (
      student_id,
      class_id,
      semester_id,
      created_by,
      updated_by
    )
    select
      selected_students.student_id,
      v_target.id,
      v_target.semester_id,
      v_user_id,
      v_user_id
    from unnest(p_student_ids) as selected_students(student_id);

    insert into public.student_year_end_actions (
      student_id,
      source_class_id,
      source_semester_id,
      action,
      target_class_id,
      target_semester_id,
      processed_by
    )
    select
      selected_students.student_id,
      v_source.id,
      v_source.semester_id,
      'promoted',
      v_target.id,
      v_target.semester_id,
      v_user_id
    from unnest(p_student_ids) as selected_students(student_id);
  else
    if p_target_class_id is not null then
      raise exception 'Graduation does not use a target class.'
        using errcode = '23514';
    end if;

    insert into public.student_year_end_actions (
      student_id,
      source_class_id,
      source_semester_id,
      action,
      processed_by
    )
    select
      selected_students.student_id,
      v_source.id,
      v_source.semester_id,
      'graduated',
      v_user_id
    from unnest(p_student_ids) as selected_students(student_id);

    update public.students
    set is_active = false,
        updated_by = v_user_id
    where students.id = any(p_student_ids);
  end if;

  return cardinality(p_student_ids);
end;
$$;

revoke all on function public.process_student_year_end(uuid, uuid[], uuid)
from public, anon, authenticated;
grant execute on function public.process_student_year_end(uuid, uuid[], uuid)
to authenticated;
