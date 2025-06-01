-- Check if tables exist
select 
    table_name,
    exists (
        select 1 
        from information_schema.tables 
        where table_schema = 'public' 
        and table_name = table_name
    ) as exists
from (values 
    ('profiles'),
    ('videos')
) as tables(table_name);

-- Check table structures
select 
    table_name,
    column_name,
    data_type,
    is_nullable
from information_schema.columns
where table_schema = 'public'
and table_name in ('profiles', 'videos')
order by table_name, ordinal_position; 