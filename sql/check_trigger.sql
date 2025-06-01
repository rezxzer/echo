-- Check trigger function
select 
    proname as function_name,
    prosrc as function_definition
from pg_proc
where proname = 'handle_new_user'
and pronamespace = (select oid from pg_namespace where nspname = 'public');

-- Check trigger
select 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgfoid::regproc as function_name,
    tgtype,
    tgenabled
from pg_trigger
where tgname = 'on_auth_user_created'; 