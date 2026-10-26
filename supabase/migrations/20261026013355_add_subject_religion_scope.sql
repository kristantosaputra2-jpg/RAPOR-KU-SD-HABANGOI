alter table public.subjects
add column religion_scope text null,
add constraint subjects_religion_scope_valid
check (
  religion_scope is null
  or religion_scope in (
    'islam',
    'christian',
    'catholic',
    'hindu',
    'buddhist',
    'confucian',
    'belief'
  )
);

comment on column public.subjects.religion_scope is
  'Optional religion group. Null means the subject applies to every student.';

create or replace function private.normalize_religion(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when value is null or btrim(value) = '' then null
    when lower(value) like '%katolik%' then 'catholic'
    when lower(value) like '%kristen%' or lower(value) like '%protestan%' then 'christian'
    when lower(value) like '%islam%' then 'islam'
    when lower(value) like '%hindu%' then 'hindu'
    when lower(value) like '%buddha%' then 'buddhist'
    when lower(value) like '%konghucu%' or lower(value) like '%khonghucu%' then 'confucian'
    when lower(value) like '%kepercayaan%' or lower(value) like '%penghayat%' then 'belief'
    else null
  end
$$;

create or replace function private.enforce_student_subject_religion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_religion text;
  student_religion text;
begin
  select religion_scope
  into expected_religion
  from public.subjects
  where id = new.subject_id;

  if expected_religion is null then
    return new;
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

revoke all on function private.normalize_religion(text) from public;
revoke all on function private.enforce_student_subject_religion() from public;

create trigger grade_entries_enforce_student_subject_religion
before insert or update of student_id, subject_id
on public.grade_entries
for each row execute function private.enforce_student_subject_religion();

create trigger report_descriptions_enforce_student_subject_religion
before insert or update of student_id, subject_id
on public.report_descriptions
for each row execute function private.enforce_student_subject_religion();
