alter table public.grade_entries
add column calculation_source text not null default 'legacy',
add constraint grade_entries_calculation_source_valid
check (calculation_source in ('legacy', 'formative_summative'));

grant insert (calculation_source) on public.grade_entries to authenticated;
grant update (calculation_source) on public.grade_entries to authenticated;

create table public.assessment_items (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  learning_outcome_id uuid not null,
  assessment_component_id uuid not null references public.assessment_components (id) on delete restrict,
  semester_id uuid not null,
  grade_level smallint not null,
  category text not null,
  kind text not null,
  title text not null,
  display_order smallint not null default 1,
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_items_id_scope_unique unique (id, class_id, semester_id),
  constraint assessment_items_class_scope_fkey
    foreign key (class_id, semester_id, grade_level)
    references public.classes (id, semester_id, grade_level)
    on delete restrict,
  constraint assessment_items_outcome_scope_fkey
    foreign key (learning_outcome_id, subject_id, semester_id, grade_level)
    references public.learning_outcomes (id, subject_id, semester_id, grade_level)
    on delete restrict,
  constraint assessment_items_grade_level_valid check (grade_level between 1 and 6),
  constraint assessment_items_category_valid check (category in ('formative', 'summative')),
  constraint assessment_items_kind_valid check (
    (category = 'formative' and kind in ('daily', 'exercise', 'assignment', 'other'))
    or (category = 'summative' and kind in ('midterm', 'final'))
  ),
  constraint assessment_items_title_length check (char_length(btrim(title)) between 1 and 100),
  constraint assessment_items_display_order_valid check (display_order > 0)
);

create unique index assessment_items_summative_kind_unique
on public.assessment_items (
  class_id,
  subject_id,
  learning_outcome_id,
  assessment_component_id,
  semester_id,
  kind
)
where category = 'summative' and is_active;

create index assessment_items_scope_idx
on public.assessment_items (
  class_id,
  subject_id,
  semester_id,
  assessment_component_id,
  learning_outcome_id
);

create index assessment_items_created_by_idx on public.assessment_items (created_by);
create index assessment_items_updated_by_idx on public.assessment_items (updated_by);

create trigger assessment_items_set_updated_at
before update on public.assessment_items
for each row execute function private.set_updated_at();

create table public.assessment_scores (
  id uuid primary key default gen_random_uuid(),
  assessment_item_id uuid not null,
  student_id uuid not null,
  class_id uuid not null,
  semester_id uuid not null,
  score numeric(5,2) not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_scores_item_scope_fkey
    foreign key (assessment_item_id, class_id, semester_id)
    references public.assessment_items (id, class_id, semester_id)
    on delete cascade,
  constraint assessment_scores_membership_fkey
    foreign key (student_id, class_id, semester_id)
    references public.class_members (student_id, class_id, semester_id)
    on delete restrict,
  constraint assessment_scores_score_valid check (score between 0 and 100),
  constraint assessment_scores_student_item_unique unique (student_id, assessment_item_id)
);

create index assessment_scores_item_idx on public.assessment_scores (assessment_item_id);
create index assessment_scores_student_idx on public.assessment_scores (student_id);
create index assessment_scores_created_by_idx on public.assessment_scores (created_by);
create index assessment_scores_updated_by_idx on public.assessment_scores (updated_by);

create trigger assessment_scores_set_updated_at
before update on public.assessment_scores
for each row execute function private.set_updated_at();

comment on table public.assessment_items is
  'Configurable formative activities and fixed PTS/PAS summative items per CP and assessment component.';
comment on table public.assessment_scores is
  'Raw 0-100 student scores for one formative or summative assessment item.';
comment on column public.grade_entries.calculation_source is
  'Distinguishes legacy manual CP scores from 40/60 formative-summative derived CP scores.';

alter table public.assessment_items enable row level security;
alter table public.assessment_scores enable row level security;

revoke all on table public.assessment_items from anon, authenticated;
grant select on table public.assessment_items to authenticated;
grant insert (
  class_id,
  subject_id,
  learning_outcome_id,
  assessment_component_id,
  semester_id,
  grade_level,
  category,
  kind,
  title,
  display_order,
  is_active,
  created_by,
  updated_by
) on public.assessment_items to authenticated;
grant update (title, display_order, is_active, updated_by)
on public.assessment_items to authenticated;

revoke all on table public.assessment_scores from anon, authenticated;
grant select on table public.assessment_scores to authenticated;
grant insert (
  assessment_item_id,
  student_id,
  class_id,
  semester_id,
  score,
  created_by,
  updated_by
) on public.assessment_scores to authenticated;
grant update (score, updated_by) on public.assessment_scores to authenticated;
grant delete on public.assessment_scores to authenticated;

create policy assessment_items_authorized_select
on public.assessment_items for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_active
      and (
        profiles.role = 'admin'
        or exists (
          select 1 from public.teacher_assignments
          join public.teacher_profiles on teacher_profiles.id = teacher_assignments.teacher_id
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active and teacher_assignments.is_active
            and teacher_assignments.class_id = assessment_items.class_id
            and teacher_assignments.subject_id = assessment_items.subject_id
            and teacher_assignments.semester_id = assessment_items.semester_id
        )
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1 from public.classes
            join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = assessment_items.class_id
              and classes.semester_id = assessment_items.semester_id
          )
        )
      )
  )
);

create policy assessment_items_authorized_insert
on public.assessment_items for insert to authenticated
with check (
  created_by = (select auth.uid()) and updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_active
      and (
        profiles.role = 'admin'
        or exists (
          select 1 from public.teacher_assignments
          join public.teacher_profiles on teacher_profiles.id = teacher_assignments.teacher_id
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active and teacher_assignments.is_active
            and teacher_assignments.class_id = assessment_items.class_id
            and teacher_assignments.subject_id = assessment_items.subject_id
            and teacher_assignments.semester_id = assessment_items.semester_id
        )
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1 from public.classes
            join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = assessment_items.class_id
              and classes.semester_id = assessment_items.semester_id
          )
        )
      )
  )
);

create policy assessment_items_authorized_update
on public.assessment_items for update to authenticated
using ((select auth.uid()) = updated_by or exists (
  select 1 from public.profiles
  where profiles.id = (select auth.uid()) and profiles.role = 'admin' and profiles.is_active
))
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_active
  )
);

create policy assessment_scores_authorized_select
on public.assessment_scores for select to authenticated
using (
  exists (
    select 1 from public.assessment_items
    where assessment_items.id = assessment_scores.assessment_item_id
  )
);

create policy assessment_scores_authorized_insert
on public.assessment_scores for insert to authenticated
with check (
  created_by = (select auth.uid()) and updated_by = (select auth.uid())
  and exists (
    select 1 from public.assessment_items
    where assessment_items.id = assessment_scores.assessment_item_id
      and assessment_items.class_id = assessment_scores.class_id
      and assessment_items.semester_id = assessment_scores.semester_id
  )
);

create policy assessment_scores_authorized_update
on public.assessment_scores for update to authenticated
using (
  exists (
    select 1 from public.assessment_items
    where assessment_items.id = assessment_scores.assessment_item_id
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.assessment_items
    where assessment_items.id = assessment_scores.assessment_item_id
  )
);

create policy assessment_scores_authorized_delete
on public.assessment_scores for delete to authenticated
using (
  exists (
    select 1 from public.assessment_items
    where assessment_items.id = assessment_scores.assessment_item_id
  )
);

create or replace function public.save_assessment_scores(
  p_assessment_item_id uuid,
  p_scores jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item public.assessment_items%rowtype;
  invalid_count integer;
  saved_count integer;
  student_record record;
  formative_average numeric;
  midterm_average numeric;
  final_average numeric;
  derived_score numeric;
begin
  if jsonb_typeof(p_scores) <> 'array' then
    raise exception 'Daftar nilai tidak valid.';
  end if;

  select * into item
  from public.assessment_items
  where id = p_assessment_item_id and is_active;

  if item.id is null then
    raise exception 'Penilaian tidak ditemukan atau Anda tidak memiliki akses.';
  end if;

  with submitted as (
    select
      nullif(value ->> 'student_id', '')::uuid as student_id,
      case
        when value ->> 'score' is null or value ->> 'score' = '' then null
        else (value ->> 'score')::numeric
      end as score
    from jsonb_array_elements(p_scores)
  )
  select count(*) into invalid_count
  from submitted
  where student_id is null
    or (score is not null and (score < 0 or score > 100))
    or not exists (
      select 1 from public.class_members
      where class_members.student_id = submitted.student_id
        and class_members.class_id = item.class_id
        and class_members.semester_id = item.semester_id
    );

  if invalid_count > 0 then
    raise exception 'Nilai harus 0 sampai 100 dan siswa harus terdaftar di kelas.';
  end if;

  with submitted as (
    select nullif(value ->> 'student_id', '')::uuid as student_id
    from jsonb_array_elements(p_scores)
  )
  select count(*) - count(distinct student_id) into invalid_count from submitted;

  if invalid_count > 0 then
    raise exception 'Siswa yang sama tidak boleh dikirim dua kali.';
  end if;

  with submitted as (
    select
      nullif(value ->> 'student_id', '')::uuid as student_id,
      case
        when value ->> 'score' is null or value ->> 'score' = '' then null
        else (value ->> 'score')::numeric
      end as score
    from jsonb_array_elements(p_scores)
  )
  insert into public.assessment_scores (
    assessment_item_id,
    student_id,
    class_id,
    semester_id,
    score,
    created_by,
    updated_by
  )
  select
    item.id,
    submitted.student_id,
    item.class_id,
    item.semester_id,
    submitted.score,
    (select auth.uid()),
    (select auth.uid())
  from submitted
  where submitted.score is not null
  on conflict (student_id, assessment_item_id)
  do update set score = excluded.score, updated_by = excluded.updated_by;

  with submitted as (
    select
      nullif(value ->> 'student_id', '')::uuid as student_id,
      case
        when value ->> 'score' is null or value ->> 'score' = '' then null
        else (value ->> 'score')::numeric
      end as score
    from jsonb_array_elements(p_scores)
  )
  delete from public.assessment_scores
  using submitted
  where assessment_scores.assessment_item_id = item.id
    and assessment_scores.student_id = submitted.student_id
    and submitted.score is null;

  for student_record in
    select distinct nullif(value ->> 'student_id', '')::uuid as student_id
    from jsonb_array_elements(p_scores)
  loop
    select
      avg(scores.score) filter (where assessments.category = 'formative'),
      avg(scores.score) filter (where assessments.category = 'summative' and assessments.kind = 'midterm'),
      avg(scores.score) filter (where assessments.category = 'summative' and assessments.kind = 'final')
    into formative_average, midterm_average, final_average
    from public.assessment_scores scores
    join public.assessment_items assessments on assessments.id = scores.assessment_item_id
    where scores.student_id = student_record.student_id
      and assessments.class_id = item.class_id
      and assessments.subject_id = item.subject_id
      and assessments.learning_outcome_id = item.learning_outcome_id
      and assessments.assessment_component_id = item.assessment_component_id
      and assessments.semester_id = item.semester_id
      and assessments.is_active;

    if formative_average is not null and midterm_average is not null and final_average is not null then
      derived_score := round(
        formative_average * 0.4 + ((midterm_average + final_average) / 2) * 0.6,
        2
      );

      insert into public.grade_entries (
        student_id,
        class_id,
        subject_id,
        learning_outcome_id,
        assessment_component_id,
        semester_id,
        grade_level,
        score,
        calculation_source,
        created_by,
        updated_by
      ) values (
        student_record.student_id,
        item.class_id,
        item.subject_id,
        item.learning_outcome_id,
        item.assessment_component_id,
        item.semester_id,
        item.grade_level,
        derived_score,
        'formative_summative',
        (select auth.uid()),
        (select auth.uid())
      )
      on conflict (
        student_id,
        class_id,
        subject_id,
        learning_outcome_id,
        assessment_component_id,
        semester_id
      ) do update set
        score = excluded.score,
        calculation_source = excluded.calculation_source,
        updated_by = excluded.updated_by;
    else
      delete from public.grade_entries
      where grade_entries.student_id = student_record.student_id
        and grade_entries.class_id = item.class_id
        and grade_entries.subject_id = item.subject_id
        and grade_entries.learning_outcome_id = item.learning_outcome_id
        and grade_entries.assessment_component_id = item.assessment_component_id
        and grade_entries.semester_id = item.semester_id
        and grade_entries.calculation_source = 'formative_summative';
    end if;
  end loop;

  select count(*) into saved_count
  from jsonb_array_elements(p_scores) value
  where value ->> 'score' is not null and value ->> 'score' <> '';

  return saved_count;
end;
$$;

revoke all on function public.save_assessment_scores(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.save_assessment_scores(uuid, jsonb) to authenticated;
