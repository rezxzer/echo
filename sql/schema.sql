-- Create profiles table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade not null primary key,
    username text unique not null,
    avatar_url text,
    bio text,
    location text,
    website text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
    on profiles for select
    using ( true );

create policy "Users can insert their own profile."
    on profiles for insert
    with check ( auth.uid() = id or auth.role() = 'service_role' );

create policy "Users can update their own profile."
    on profiles for update
    using ( auth.uid() = id );

-- Create storage bucket for avatars
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Create storage policy
create policy "Avatar images are publicly accessible."
    on storage.objects for select
    using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
    on storage.objects for insert
    with check ( bucket_id = 'avatars' );

-- Drop existing trigger and function if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create function to handle user creation
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

-- Create videos table
create table if not exists public.videos (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    title text not null,
    description text,
    video_url text not null,
    thumbnail_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security for videos
alter table public.videos enable row level security;

-- Create policies for videos
create policy "Videos are viewable by everyone."
    on videos for select
    using ( true );

create policy "Users can insert their own videos."
    on videos for insert
    with check ( auth.uid() = user_id );

create policy "Users can update their own videos."
    on videos for update
    using ( auth.uid() = user_id );

create policy "Users can delete their own videos."
    on videos for delete
    using ( auth.uid() = user_id );

-- Create storage bucket for videos
insert into storage.buckets (id, name, public) values ('videos', 'videos', true);

-- Create storage policy for videos
create policy "Videos are publicly accessible."
    on storage.objects for select
    using ( bucket_id = 'videos' );

create policy "Users can upload their own videos."
    on storage.objects for insert
    with check ( bucket_id = 'videos' ); 