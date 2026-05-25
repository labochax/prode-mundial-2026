-- Expand match statuses to preserve Football-Data live/result lifecycle.
-- Final Prode scoring still only runs when status = 'FINISHED'.

alter table public.matches
drop constraint matches_status_allowed;

alter table public.matches
add constraint matches_status_allowed check (
  status in (
    'SCHEDULED',
    'TIMED',
    'IN_PLAY',
    'PAUSED',
    'EXTRA_TIME',
    'PENALTY_SHOOTOUT',
    'FINISHED',
    'SUSPENDED',
    'POSTPONED',
    'CANCELLED',
    'AWARDED'
  )
);

comment on column public.matches.status is
  'Football-Data style match lifecycle. Only FINISHED triggers official scoring in the MVP sync flow.';
