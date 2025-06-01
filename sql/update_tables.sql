-- Drop dependent tables first
drop table if exists public.content;
drop table if exists public.files;
drop table if exists public.videos;
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