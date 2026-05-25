-- Adds multi-subgroup support while preserving profiles.prode_subgroup as the
-- backward-compatible primary subgroup.

alter table public.profiles
add column prode_subgroups text[] not null default '{}';

comment on column public.profiles.prode_subgroups is
  'Up to three normalized Prode subgroup labels. profiles.prode_subgroup remains the primary/default subgroup for backward compatibility.';

update public.profiles
set prode_subgroups = array[prode_subgroup]
where prode_subgroup is not null
  and btrim(prode_subgroup) <> ''
  and cardinality(prode_subgroups) = 0;

alter table public.profiles
add constraint profiles_prode_subgroups_max_three check (
  cardinality(prode_subgroups) <= 3
);
