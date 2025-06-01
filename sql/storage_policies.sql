-- Drop existing storage policies
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Users can upload their own avatar." on storage.objects;
drop policy if exists "Users can update their own avatar." on storage.objects;
drop policy if exists "Users can delete their own avatar." on storage.objects;

drop policy if exists "Users can delete their own content files." on storage.objects;
drop policy if exists "Users can update their own content files." on storage.objects;
drop policy if exists "Users can upload their own content files." on storage.objects;
drop policy if exists "Users can view their own content files." on storage.objects;

drop policy if exists "Users can delete their own files." on storage.objects;
drop policy if exists "Users can update their own files." on storage.objects;
drop policy if exists "Users can upload their own files." on storage.objects;
drop policy if exists "Users can view their own files." on storage.objects;

-- Create new storage buckets if they don't exist
insert into storage.buckets (id, name, public) 
values 
    ('avatars', 'avatars', true),
    ('videos', 'videos', true),
    ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

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