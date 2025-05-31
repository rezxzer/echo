-- Create profiles table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade not null primary key,
    username text unique not null,
    avatar_url text,
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
    with check ( auth.uid() = id );

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

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, username)
    values (new.id, new.raw_user_meta_data->>'username');
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user(); 