// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Authentication functions
async function register(email, password, username) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Registration error:', error);
        return { data: null, error };
    }
}

async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Login error:', error);
        return { data: null, error };
    }
}

async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Logout error:', error);
        return { error };
    }
}

async function getCurrentUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            return { user, profile };
        }
        return null;
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
}

// Content management functions
async function fetchContent(type = 'all', page = 1, searchQuery = '') {
    try {
        const itemsPerPage = 10;
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        let query = supabase
            .from('content')
            .select(`
                *,
                profiles (
                    username,
                    avatar_url
                )
            `, { count: 'exact' });

        if (type !== 'all') {
            query = query.eq('type', type);
        }

        if (searchQuery) {
            query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { data, error: null, count };
    } catch (error) {
        console.error('Error fetching content:', error);
        return { data: null, error, count: 0 };
    }
}

async function fetchSingleContent(contentId) {
    try {
        const { data, error } = await supabase
            .from('content')
            .select(`
                *,
                profiles (
                    username,
                    avatar_url
                )
            `)
            .eq('id', contentId)
            .single();

        if (error) throw error;

        // Increment view count
        const { error: updateError } = await supabase
            .from('content')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', contentId);

        if (updateError) throw updateError;

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching single content:', error);
        return { data: null, error };
    }
}

async function createContent(content) {
    try {
        const { data, error } = await supabase
            .from('content')
            .insert([content])
            .select()
            .single();
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Create content error:', error);
        return { data: null, error };
    }
}

async function updateContent(contentId, contentData) {
    try {
        const { data, error } = await supabase
            .from('content')
            .update(contentData)
            .eq('id', contentId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating content:', error);
        return { data: null, error };
    }
}

async function deleteContent(contentId) {
    try {
        const { error } = await supabase
            .from('content')
            .delete()
            .eq('id', contentId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error deleting content:', error);
        return { error };
    }
}

// File management functions
async function uploadFile(file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${supabase.auth.user().id}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('files')
            .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('files')
            .getPublicUrl(filePath);

        // Save file metadata
        const { data: fileData, error: dbError } = await supabase
            .from('files')
            .insert([{
                user_id: supabase.auth.user().id,
                name: file.name,
                path: filePath,
                url: publicUrl,
                size: file.size,
                type: file.type
            }])
            .select()
            .single();

        if (dbError) throw dbError;
        return { data: fileData, error: null };
    } catch (error) {
        console.error('Upload file error:', error);
        return { data: null, error };
    }
}

async function fetchFiles() {
    try {
        const { data, error } = await supabase
            .from('files')
            .select('*')
            .eq('user_id', supabase.auth.user().id);
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Fetch files error:', error);
        return { data: null, error };
    }
}

// Comment management functions
async function getComments(contentId) {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles (
                    username,
                    avatar_url
                )
            `)
            .eq('content_id', contentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching comments:', error);
        return { data: null, error };
    }
}

async function addComment(contentId, content) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('არ ხართ ავტორიზებული');

        const { data, error } = await supabase
            .from('comments')
            .insert([
                {
                    content_id: contentId,
                    user_id: user.id,
                    content: content
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error adding comment:', error);
        return { data: null, error };
    }
}

async function likeContent(contentId) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('არ ხართ ავტორიზებული');

        const { data: content, error: fetchError } = await supabase
            .from('content')
            .select('likes')
            .eq('id', contentId)
            .single();

        if (fetchError) throw fetchError;

        const likes = content.likes || [];
        if (likes.includes(user.id)) {
            return { error: new Error('თქვენ უკვე მოგწონთ ეს კონტენტი') };
        }

        const { data, error } = await supabase
            .from('content')
            .update({ likes: [...likes, user.id] })
            .eq('id', contentId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error liking content:', error);
        return { data: null, error };
    }
}

async function unlikeContent(contentId) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('არ ხართ ავტორიზებული');

        const { data: content, error: fetchError } = await supabase
            .from('content')
            .select('likes')
            .eq('id', contentId)
            .single();

        if (fetchError) throw fetchError;

        const likes = content.likes || [];
        if (!likes.includes(user.id)) {
            return { error: new Error('თქვენ უკვე არ მოგწონთ ეს კონტენტი') };
        }

        const { data, error } = await supabase
            .from('content')
            .update({ likes: likes.filter(id => id !== user.id) })
            .eq('id', contentId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error unliking content:', error);
        return { data: null, error };
    }
}

// Export functions
window.supabaseClient = {
    register,
    login,
    logout,
    getCurrentUser,
    fetchContent,
    fetchSingleContent,
    createContent,
    updateContent,
    deleteContent,
    likeContent,
    unlikeContent,
    uploadFile,
    fetchFiles,
    getComments,
    addComment
}; 