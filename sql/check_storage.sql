-- Check storage buckets
select 
    id,
    name,
    public,
    created_at
from storage.buckets
where id in ('avatars', 'videos', 'thumbnails')
order by id;

-- Check storage policies
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
where schemaname = 'storage'
and tablename = 'objects'
order by policyname; 