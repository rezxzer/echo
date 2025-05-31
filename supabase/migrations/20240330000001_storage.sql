-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
    ('avatars', 'avatars', true),
    ('content', 'content', false),
    ('files', 'files', false);

-- Set up storage policies
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

-- Content files policies
CREATE POLICY "Users can view their own content files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'content' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

CREATE POLICY "Users can upload their own content files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'content' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

CREATE POLICY "Users can update their own content files"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'content' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

CREATE POLICY "Users can delete their own content files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'content' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

-- General files policies
CREATE POLICY "Users can view their own files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'files' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

CREATE POLICY "Users can upload their own files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'files' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

CREATE POLICY "Users can update their own files"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'files' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

CREATE POLICY "Users can delete their own files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'files' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    ); 