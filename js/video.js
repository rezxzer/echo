// Get video ID from URL
const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('id');

// DOM Elements
const videoPlayer = document.getElementById('videoPlayer');
const videoTitle = document.getElementById('videoTitle');
const videoDescription = document.getElementById('videoDescription');
const videoViews = document.getElementById('videoViews');
const videoDate = document.getElementById('videoDate');
const likeButton = document.getElementById('likeButton');
const likeCount = document.getElementById('likeCount');
const shareButton = document.getElementById('shareButton');
const saveButton = document.getElementById('saveButton');
const authorAvatar = document.getElementById('authorAvatar');
const authorName = document.getElementById('authorName');
const authorSubscribers = document.getElementById('authorSubscribers');
const subscribeButton = document.getElementById('subscribeButton');
const commentInput = document.getElementById('commentInput');
const submitComment = document.getElementById('submitComment');
const commentsList = document.getElementById('commentsList');
const relatedVideos = document.getElementById('relatedVideos');
const commentAvatar = document.getElementById('commentAvatar');

// Load video data
async function loadVideo() {
    try {
        const { data: video, error } = await supabase.getVideoById(videoId);
        if (error) throw error;

        // Update video player
        videoPlayer.src = video.video_url;
        videoTitle.textContent = video.title;
        videoDescription.textContent = video.description;
        videoViews.textContent = `${formatViews(video.views)} views`;
        videoDate.textContent = formatDate(video.created_at);

        // Update author info
        authorAvatar.src = video.profiles?.avatar_url || 'default-avatar.jpg';
        authorName.textContent = video.profiles?.username || 'Unknown';
        authorSubscribers.textContent = `${formatViews(video.profiles?.subscribers || 0)} subscribers`;

        // Update like count
        likeCount.textContent = formatViews(video.likes || 0);

        // Load comments
        loadComments();

        // Load related videos
        loadRelatedVideos();

        // Increment view count
        await supabase.incrementVideoViews(videoId);
    } catch (error) {
        console.error('Error loading video:', error);
        showError('Failed to load video. Please try again later.');
    }
}

// Load comments
async function loadComments() {
    try {
        const { data: comments, error } = await supabase
            .from('comments')
            .select('*, profiles(username, avatar_url)')
            .eq('video_id', videoId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        commentsList.innerHTML = comments.map(comment => `
            <div class="comment mb-3">
                <div class="d-flex">
                    <img src="${comment.profiles?.avatar_url || 'default-avatar.jpg'}" 
                         alt="${comment.profiles?.username || 'Unknown'}" 
                         class="rounded-circle me-3" 
                         style="width: 40px; height: 40px;">
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="mb-0">${comment.profiles?.username || 'Unknown'}</h6>
                            <small class="text-muted">${formatDate(comment.created_at)}</small>
                        </div>
                        <p class="mb-0">${comment.content}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading comments:', error);
        showError('Failed to load comments. Please try again later.');
    }
}

// Load related videos
async function loadRelatedVideos() {
    try {
        const { data: videos, error } = await supabase
            .from('videos')
            .select('*, profiles(username)')
            .neq('id', videoId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        relatedVideos.innerHTML = videos.map(video => `
            <div class="related-video mb-3">
                <div class="d-flex">
                    <div class="video-thumbnail me-3" style="width: 168px;">
                        <img src="${video.thumbnail_url || 'placeholder.jpg'}" 
                             alt="${video.title}" 
                             class="w-100 h-100 object-fit-cover">
                        <span class="video-duration">${formatDuration(video.duration)}</span>
                    </div>
                    <div class="video-info">
                        <h6 class="mb-1">${video.title}</h6>
                        <p class="mb-1 text-muted">${video.profiles?.username || 'Unknown'}</p>
                        <small class="text-muted">${formatViews(video.views)} views • ${formatDate(video.created_at)}</small>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading related videos:', error);
        showError('Failed to load related videos. Please try again later.');
    }
}

// Handle like button click
likeButton.addEventListener('click', async () => {
    try {
        const { data, error } = await supabase
            .from('likes')
            .insert([{ video_id: videoId }])
            .select()
            .single();

        if (error) throw error;

        // Update like count
        const currentLikes = parseInt(likeCount.textContent);
        likeCount.textContent = formatViews(currentLikes + 1);
        likeButton.classList.add('active');
    } catch (error) {
        console.error('Error liking video:', error);
        showError('Failed to like video. Please try again later.');
    }
});

// Handle share button click
shareButton.addEventListener('click', () => {
    const videoUrl = window.location.href;
    navigator.clipboard.writeText(videoUrl)
        .then(() => {
            showSuccess('Video URL copied to clipboard!');
        })
        .catch(() => {
            showError('Failed to copy video URL. Please try again.');
        });
});

// Handle save button click
saveButton.addEventListener('click', async () => {
    try {
        const { data, error } = await supabase
            .from('saved_videos')
            .insert([{ video_id: videoId }])
            .select()
            .single();

        if (error) throw error;

        saveButton.classList.add('active');
        showSuccess('Video saved to your library!');
    } catch (error) {
        console.error('Error saving video:', error);
        showError('Failed to save video. Please try again later.');
    }
});

// Handle subscribe button click
subscribeButton.addEventListener('click', async () => {
    try {
        const { data, error } = await supabase
            .from('subscriptions')
            .insert([{ channel_id: videoId }])
            .select()
            .single();

        if (error) throw error;

        subscribeButton.textContent = 'Subscribed';
        subscribeButton.classList.add('btn-secondary');
        showSuccess('Successfully subscribed to the channel!');
    } catch (error) {
        console.error('Error subscribing to channel:', error);
        showError('Failed to subscribe. Please try again later.');
    }
});

// Handle comment submission
submitComment.addEventListener('click', async () => {
    const content = commentInput.value.trim();
    if (!content) return;

    try {
        const { data, error } = await supabase
            .from('comments')
            .insert([{
                video_id: videoId,
                content: content
            }])
            .select()
            .single();

        if (error) throw error;

        // Clear input and reload comments
        commentInput.value = '';
        loadComments();
        showSuccess('Comment posted successfully!');
    } catch (error) {
        console.error('Error posting comment:', error);
        showError('Failed to post comment. Please try again later.');
    }
});

// Utility functions
function formatViews(views) {
    if (views >= 1000000) {
        return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
        return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return 'Today';
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return `${days} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function showSuccess(message) {
    // Implement your success notification here
    console.log('Success:', message);
}

function showError(message) {
    // Implement your error notification here
    console.error('Error:', message);
}

// Load video when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (videoId) {
        loadVideo();
    } else {
        showError('No video ID provided.');
    }
}); 