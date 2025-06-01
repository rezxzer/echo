-- Drop existing tables if they exist
drop table if exists public.videos;
drop table if exists public.profiles;

-- Create profiles table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade not null primary key,
    username text unique not null,
    avatar_url text,
    bio text,
    location text,
    website text,
    social_links jsonb default '{}'::jsonb,
    total_videos integer default 0,
    total_views integer default 0,
    total_likes integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create videos table
create table if not exists public.videos (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    title text not null,
    description text,
    video_url text not null,
    thumbnail_url text,
    duration integer,
    views integer default 0,
    likes integer default 0,
    status text default 'processing' check (status in ('processing', 'ready', 'error')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists profiles_username_idx on profiles(username);
create index if not exists videos_user_id_idx on videos(user_id);
create index if not exists videos_created_at_idx on videos(created_at);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.videos enable row level security;

-- Create storage buckets
insert into storage.buckets (id, name, public) 
values 
    ('avatars', 'avatars', true),
    ('videos', 'videos', true),
    ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

-- Create RLS policies for profiles
create policy "Public profiles are viewable by everyone."
    on profiles for select
    using ( true );

create policy "Users can insert their own profile."
    on profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update their own profile."
    on profiles for update
    using ( auth.uid() = id );

create policy "Users can delete their own profile."
    on profiles for delete
    using ( auth.uid() = id );

-- Create RLS policies for videos
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

-- Create storage policies for avatars
create policy "Avatar images are publicly accessible."
    on storage.objects for select
    using ( bucket_id = 'avatars' );

create policy "Users can upload their own avatar."
    on storage.objects for insert
    with check ( bucket_id = 'avatars' AND auth.uid() = owner );

create policy "Users can update their own avatar."
    on storage.objects for update
    using ( bucket_id = 'avatars' AND auth.uid() = owner );

create policy "Users can delete their own avatar."
    on storage.objects for delete
    using ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Create storage policies for videos
create policy "Videos are publicly accessible."
    on storage.objects for select
    using ( bucket_id = 'videos' );

create policy "Users can upload their own videos."
    on storage.objects for insert
    with check ( bucket_id = 'videos' AND auth.uid() = owner );

create policy "Users can update their own videos."
    on storage.objects for update
    using ( bucket_id = 'videos' AND auth.uid() = owner );

create policy "Users can delete their own videos."
    on storage.objects for delete
    using ( bucket_id = 'videos' AND auth.uid() = owner );

-- Create storage policies for thumbnails
create policy "Thumbnails are publicly accessible."
    on storage.objects for select
    using ( bucket_id = 'thumbnails' );

create policy "Users can upload their own thumbnails."
    on storage.objects for insert
    with check ( bucket_id = 'thumbnails' AND auth.uid() = owner );

create policy "Users can update their own thumbnails."
    on storage.objects for update
    using ( bucket_id = 'thumbnails' AND auth.uid() = owner );

create policy "Users can delete their own thumbnails."
    on storage.objects for delete
    using ( bucket_id = 'thumbnails' AND auth.uid() = owner );

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
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user(); 