-- Drop existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
declare
    username text;
begin
    -- Get username from metadata or use email prefix
    if new.raw_user_meta_data is not null and new.raw_user_meta_data->>'username' is not null then
        username := new.raw_user_meta_data->>'username';
    else
        username := split_part(new.email, '@', 1);
    end if;

    -- Insert profile
    insert into public.profiles (id, username)
    values (new.id, username);

    return new;
exception
    when others then
        -- Log error and continue
        raise notice 'Error creating profile: %', SQLERRM;
        return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user(); 