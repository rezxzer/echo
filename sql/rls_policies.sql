-- Drop existing policies
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update their own profile." on profiles;
drop policy if exists "Users can delete their own profile." on profiles;

drop policy if exists "Videos are viewable by everyone." on videos;
drop policy if exists "Users can insert their own videos." on videos;
drop policy if exists "Users can update their own videos." on videos;
drop policy if exists "Users can delete their own videos." on videos;

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