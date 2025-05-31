// Database operations
async function createProfile(userId, username, avatarUrl = null) {
    try {
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .insert([
                {
                    id: userId,
                    username,
                    avatar_url: avatarUrl,
                    updated_at: new Date()
                }
            ]);
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Create profile error:', error);
        return { data: null, error };
    }
}

async function updateProfile(userId, updates) {
    try {
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .update(updates)
            .eq('id', userId);
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Update profile error:', error);
        return { data: null, error };
    }
}

async function getProfile(userId) {
    try {
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get profile error:', error);
        return { data: null, error };
    }
}

async function uploadFile(file, bucket = 'avatars') {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data, error } = await window.supabaseClient.storage
            .from(bucket)
            .upload(fileName, file);
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Upload file error:', error);
        return { data: null, error };
    }
}

// Export functions
window.db = {
    createProfile,
    updateProfile,
    getProfile,
    uploadFile
}; 