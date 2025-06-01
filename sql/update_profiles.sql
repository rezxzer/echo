-- Drop existing table
drop table if exists public.profiles;

-- Create profiles table with updated structure
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

-- Create index
create index if not exists profiles_username_idx on profiles(username);

-- Enable Row Level Security
alter table public.profiles enable row level security; 