// Import Supabase client from config
import { supabaseClient } from './supabase-config.js';

// Export the client for use in other files
export const supabase = supabaseClient;

// Initialize auth state
let currentUser = null;

// Auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        console.log('User signed in:', currentUser);
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        console.log('User signed out');
    }
});

// Export auth functions
export const auth = {
    getCurrentUser: () => currentUser,
    signIn: async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error signing in:', error.message);
            throw error;
        }
    },
    signOut: async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('Error signing out:', error.message);
            throw error;
        }
    }
};

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

// Video management functions
/**
 * Upload a video to Supabase storage and create a video record
 * @param {File} videoFile - The video file to upload
 * @param {File} thumbnailFile - Optional thumbnail file
 * @param {Object} metadata - Video metadata
 * @returns {Promise<{data: Object, error: Error}>}
 */
async function uploadVideo(videoFile, thumbnailFile, metadata) {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Generate unique file names
        const videoFileName = `${user.id}/${Date.now()}_${videoFile.name}`;
        const thumbnailFileName = thumbnailFile ? `${user.id}/${Date.now()}_${thumbnailFile.name}` : null;

        // Upload video file
        const { data: videoData, error: videoError } = await supabase.storage
            .from('videos')
            .upload(videoFileName, videoFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (videoError) throw videoError;

        // Upload thumbnail if provided
        let thumbnailUrl = null;
        if (thumbnailFile) {
            const { data: thumbnailData, error: thumbnailError } = await supabase.storage
                .from('thumbnails')
                .upload(thumbnailFileName, thumbnailFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (thumbnailError) throw thumbnailError;
            thumbnailUrl = thumbnailData.path;
        }

        // Get video duration
        const duration = await getVideoDuration(videoFile);

        // Create video record
        const { data, error } = await supabase
            .from('videos')
            .insert([
                {
                    user_id: user.id,
                    title: metadata.title,
                    description: metadata.description,
                    video_path: videoData.path,
                    thumbnail_path: thumbnailUrl,
                    duration: duration,
                    visibility: metadata.visibility,
                    status: 'processing'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Error uploading video:', error);
        return { data: null, error };
    }
}

/**
 * Get video duration using HTML5 video element
 * @param {File} videoFile - The video file
 * @returns {Promise<number>} - Duration in seconds
 */
function getVideoDuration(videoFile) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            resolve(Math.round(video.duration));
        };

        video.onerror = () => {
            window.URL.revokeObjectURL(video.src);
            reject(new Error('Error loading video metadata'));
        };

        video.src = URL.createObjectURL(videoFile);
    });
}

/**
 * Update video processing status
 * @param {string} videoId - The video ID
 * @param {string} status - The new status
 * @returns {Promise<{data: Object, error: Error}>}
 */
async function updateVideoStatus(videoId, status) {
    try {
        const { data, error } = await supabase
            .from('videos')
            .update({ status })
            .eq('id', videoId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating video status:', error);
        return { data: null, error };
    }
}

/**
 * Get video upload progress
 * @param {string} videoId - The video ID
 * @returns {Promise<{data: Object, error: Error}>}
 */
async function getVideoUploadProgress(videoId) {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('status, processing_progress')
            .eq('id', videoId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error getting upload progress:', error);
        return { data: null, error };
    }
}

async function getVideoById(videoId) {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('*, profiles(username)')
            .eq('id', videoId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching video:', error);
        return { data: null, error };
    }
}

async function updateVideo(videoId, updates) {
    try {
        const { data, error } = await supabase
            .from('videos')
            .update(updates)
            .eq('id', videoId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Error updating video:', error);
        return { data: null, error };
    }
}

async function deleteVideo(videoId) {
    try {
        // Get video data first
        const { data: video, error: fetchError } = await getVideoById(videoId);
        if (fetchError) throw fetchError;

        // Delete video file from storage
        if (video.video_url) {
            const { error: videoDeleteError } = await supabase.storage
                .from('content')
                .remove([video.video_url]);

            if (videoDeleteError) throw videoDeleteError;
        }

        // Delete thumbnail from storage
        if (video.thumbnail_url) {
            const { error: thumbnailDeleteError } = await supabase.storage
                .from('content')
                .remove([video.thumbnail_url]);

            if (thumbnailDeleteError) throw thumbnailDeleteError;
        }

        // Delete video record
        const { error: deleteError } = await supabase
            .from('videos')
            .delete()
            .eq('id', videoId);

        if (deleteError) throw deleteError;

        return { error: null };
    } catch (error) {
        console.error('Error deleting video:', error);
        return { error };
    }
}

async function incrementVideoViews(videoId) {
    try {
        const { data, error } = await supabase.rpc('increment_video_views', {
            video_id: videoId
        });

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Error incrementing video views:', error);
        return { data: null, error };
    }
}

async function searchVideos(query, page = 1, limit = 12) {
    try {
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        const { data, error, count } = await supabase
            .from('videos')
            .select('*, profiles(username)', { count: 'exact' })
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .order('created_at', { ascending: false })
            .range(start, end);

        if (error) throw error;

        return { data, count, error: null };
    } catch (error) {
        console.error('Error searching videos:', error);
        return { data: null, count: 0, error };
    }
}

// Export functions
window.supabaseClient = {
    register,
    auth,
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
    addComment,
    uploadVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    incrementVideoViews,
    searchVideos
}; 