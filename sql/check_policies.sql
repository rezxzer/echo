-- Check RLS policies for profiles
select 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
from pg_policies
where schemaname = 'public'
and tablename = 'profiles'
order by policyname;

-- Check RLS policies for videos
select 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
from pg_policies
where schemaname = 'public'
and tablename = 'videos'
order by policyname; 