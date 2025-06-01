// Categories and Tags Management
class CategoryManager {
    constructor() {
        this.categories = [
            { id: 'gaming', name: 'Gaming', icon: 'fa-gamepad' },
            { id: 'music', name: 'Music', icon: 'fa-music' },
            { id: 'education', name: 'Education', icon: 'fa-graduation-cap' },
            { id: 'sports', name: 'Sports', icon: 'fa-futbol' },
            { id: 'tech', name: 'Technology', icon: 'fa-microchip' },
            { id: 'entertainment', name: 'Entertainment', icon: 'fa-film' },
            { id: 'cooking', name: 'Cooking', icon: 'fa-utensils' },
            { id: 'travel', name: 'Travel', icon: 'fa-plane' },
            { id: 'fashion', name: 'Fashion', icon: 'fa-tshirt' },
            { id: 'art', name: 'Art', icon: 'fa-palette' }
        ];

        this.tags = new Set();
    }

    // Get all categories
    getCategories() {
        return this.categories;
    }

    // Get category by ID
    getCategoryById(id) {
        return this.categories.find(category => category.id === id);
    }

    // Add new category
    async addCategory(category) {
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert([category])
                .select();

            if (error) throw error;
            this.categories.push(data[0]);
            return data[0];
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    }

    // Add tags to video
    async addTagsToVideo(videoId, tags) {
        try {
            const tagObjects = tags.map(tag => ({
                video_id: videoId,
                tag: tag.toLowerCase()
            }));

            const { data, error } = await supabase
                .from('video_tags')
                .insert(tagObjects);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding tags:', error);
            throw error;
        }
    }

    // Get video tags
    async getVideoTags(videoId) {
        try {
            const { data, error } = await supabase
                .from('video_tags')
                .select('tag')
                .eq('video_id', videoId);

            if (error) throw error;
            return data.map(item => item.tag);
        } catch (error) {
            console.error('Error getting video tags:', error);
            throw error;
        }
    }

    // Search videos by category
    async searchVideosByCategory(categoryId, page = 1, limit = 12) {
        try {
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('category_id', categoryId)
                .eq('visibility', 'public')
                .order('created_at', { ascending: false })
                .range((page - 1) * limit, page * limit - 1);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error searching videos by category:', error);
            throw error;
        }
    }

    // Search videos by tag
    async searchVideosByTag(tag, page = 1, limit = 12) {
        try {
            const { data, error } = await supabase
                .from('video_tags')
                .select('video_id')
                .eq('tag', tag.toLowerCase());

            if (error) throw error;

            const videoIds = data.map(item => item.video_id);

            const { data: videos, error: videosError } = await supabase
                .from('videos')
                .select('*')
                .in('id', videoIds)
                .eq('visibility', 'public')
                .order('created_at', { ascending: false })
                .range((page - 1) * limit, page * limit - 1);

            if (videosError) throw videosError;
            return videos;
        } catch (error) {
            console.error('Error searching videos by tag:', error);
            throw error;
        }
    }

    // Get popular tags
    async getPopularTags(limit = 10) {
        try {
            const { data, error } = await supabase
                .from('video_tags')
                .select('tag, count')
                .order('count', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting popular tags:', error);
            throw error;
        }
    }
}

// Export the manager
window.categoryManager = new CategoryManager(); 