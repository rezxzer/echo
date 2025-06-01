// DOM Elements
const videoTitle = document.getElementById('videoTitle');
const videoDescription = document.getElementById('videoDescription');
const channelAvatar = document.getElementById('channelAvatar');
const channelName = document.getElementById('channelName');
const videoDate = document.getElementById('videoDate');
const likeBtn = document.getElementById('likeBtn');
const dislikeBtn = document.getElementById('dislikeBtn');
const likeCount = document.getElementById('likeCount');
const dislikeCount = document.getElementById('dislikeCount');
const shareBtn = document.getElementById('shareBtn');
const saveBtn = document.getElementById('saveBtn');
const subscribeBtn = document.getElementById('subscribeBtn');
const showMoreBtn = document.getElementById('showMoreBtn');
const userAvatar = document.getElementById('userAvatar');
const commentInput = document.getElementById('commentInput');
const cancelCommentBtn = document.getElementById('cancelCommentBtn');
const submitCommentBtn = document.getElementById('submitCommentBtn');
const commentsList = document.getElementById('commentsList');
const relatedVideos = document.getElementById('relatedVideos');
const shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
const videoLink = document.getElementById('videoLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');

// State
let currentVideo = null;
let isSubscribed = false;
let isLiked = false;
let isDisliked = false;
let isSaved = false;
let isDescriptionExpanded = false;

// Initialize page
async function initPage() {
    try {
        const videoId = new URLSearchParams(window.location.search).get('id');
        if (!videoId) {
            window.location.href = '/';
            return;
        }

        // Get video data
        const { data: video, error } = await supabase
            .from('videos')
            .select('*, users(*)')
            .eq('id', videoId)
            .single();

        if (error) throw error;

        currentVideo = video;
        updateVideoInfo(video);
        await loadUserInteractions();
        await loadComments();
        await loadRelatedVideos();
        updateUserAvatar();
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('Failed to load video');
    }
}

// Update video information
function updateVideoInfo(video) {
    // Update title and description
    videoTitle.textContent = video.title;
    videoDescription.textContent = video.description;
    videoDate.textContent = new Date(video.created_at).toLocaleDateString();

    // Update channel info
    channelAvatar.src = video.users.avatar_url || 'https://via.placeholder.com/40';
    channelName.textContent = video.users.username;

    // Update video link
    videoLink.value = window.location.href;
}

// Load user interactions
async function loadUserInteractions() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get subscription status
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('subscriber_id', user.id)
            .eq('channel_id', currentVideo.user_id)
            .single();

        isSubscribed = !!subscription;
        updateSubscribeButton();

        // Get like/dislike status
        const { data: interaction } = await supabase
            .from('video_interactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('video_id', currentVideo.id)
            .single();

        if (interaction) {
            isLiked = interaction.type === 'like';
            isDisliked = interaction.type === 'dislike';
            updateLikeButtons();
        }

        // Get save status
        const { data: saved } = await supabase
            .from('saved_videos')
            .select('*')
            .eq('user_id', user.id)
            .eq('video_id', currentVideo.id)
            .single();

        isSaved = !!saved;
        updateSaveButton();
    } catch (error) {
        console.error('Error loading user interactions:', error);
    }
}

// Update subscribe button
function updateSubscribeButton() {
    subscribeBtn.innerHTML = `
        <i class="fas fa-${isSubscribed ? 'bell' : 'bell-slash'} me-2"></i>
        ${isSubscribed ? 'Subscribed' : 'Subscribe'}
    `;
    subscribeBtn.classList.toggle('btn-primary', isSubscribed);
    subscribeBtn.classList.toggle('btn-outline-primary', !isSubscribed);
}

// Update like buttons
function updateLikeButtons() {
    likeBtn.classList.toggle('btn-primary', isLiked);
    likeBtn.classList.toggle('btn-outline-secondary', !isLiked);
    dislikeBtn.classList.toggle('btn-primary', isDisliked);
    dislikeBtn.classList.toggle('btn-outline-secondary', !isDisliked);
}

// Update save button
function updateSaveButton() {
    saveBtn.innerHTML = `
        <i class="fas fa-bookmark${isSaved ? '' : '-o'} me-2"></i>
        ${isSaved ? 'Saved' : 'Save'}
    `;
    saveBtn.classList.toggle('btn-primary', isSaved);
    saveBtn.classList.toggle('btn-outline-secondary', !isSaved);
}

// Load comments
async function loadComments() {
    try {
        const { data: comments, error } = await supabase
            .from('comments')
            .select('*, users(*)')
            .eq('video_id', currentVideo.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        commentsList.innerHTML = comments.map(comment => `
            <div class="d-flex mb-4">
                <img src="${comment.users.avatar_url || 'https://via.placeholder.com/40'}" 
                     alt="${comment.users.username}" 
                     class="rounded-circle me-3" 
                     style="width: 40px; height: 40px;">
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center mb-1">
                        <h6 class="mb-0 me-2">${comment.users.username}</h6>
                        <small class="text-muted">${new Date(comment.created_at).toLocaleDateString()}</small>
                    </div>
                    <p class="mb-0">${comment.content}</p>
                    <div class="mt-2">
                        <button class="btn btn-link btn-sm p-0 me-3" onclick="likeComment('${comment.id}')">
                            <i class="fas fa-thumbs-up me-1"></i>
                            <span>${comment.likes || 0}</span>
                        </button>
                        <button class="btn btn-link btn-sm p-0" onclick="replyToComment('${comment.id}')">
                            <i class="fas fa-reply me-1"></i>
                            Reply
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading comments:', error);
        showError('Failed to load comments');
    }
}

// Load related videos
async function loadRelatedVideos() {
    try {
        const { data: videos, error } = await supabase
            .from('videos')
            .select('*, users(*)')
            .eq('category_id', currentVideo.category_id)
            .neq('id', currentVideo.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        relatedVideos.innerHTML = videos.map(video => `
            <div class="d-flex mb-3">
                <img src="${video.thumbnail_url}" 
                     alt="${video.title}" 
                     class="rounded" 
                     style="width: 120px; height: 68px; object-fit: cover;">
                <div class="ms-3">
                    <h6 class="mb-1">
                        <a href="/video.html?id=${video.id}" class="text-decoration-none text-dark">
                            ${video.title}
                        </a>
                    </h6>
                    <small class="text-muted d-block">${video.users.username}</small>
                    <small class="text-muted">${new Date(video.created_at).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading related videos:', error);
        showError('Failed to load related videos');
    }
}

// Update user avatar
async function updateUserAvatar() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('users')
            .select('avatar_url')
            .eq('id', user.id)
            .single();

        userAvatar.src = profile?.avatar_url || 'https://via.placeholder.com/40';
    } catch (error) {
        console.error('Error updating user avatar:', error);
    }
}

// Event Handlers
async function handleSubscribe() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        if (isSubscribed) {
            await supabase
                .from('subscriptions')
                .delete()
                .eq('subscriber_id', user.id)
                .eq('channel_id', currentVideo.user_id);
        } else {
            await supabase
                .from('subscriptions')
                .insert({
                    subscriber_id: user.id,
                    channel_id: currentVideo.user_id,
                    created_at: new Date().toISOString()
                });
        }

        isSubscribed = !isSubscribed;
        updateSubscribeButton();
    } catch (error) {
        console.error('Error handling subscribe:', error);
        showError('Failed to update subscription');
    }
}

async function handleLike() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        if (isLiked) {
            await supabase
                .from('video_interactions')
                .delete()
                .eq('user_id', user.id)
                .eq('video_id', currentVideo.id);
        } else {
            await supabase
                .from('video_interactions')
                .upsert({
                    user_id: user.id,
                    video_id: currentVideo.id,
                    type: 'like'
                });
        }

        isLiked = !isLiked;
        isDisliked = false;
        updateLikeButtons();
    } catch (error) {
        console.error('Error handling like:', error);
        showError('Failed to update like');
    }
}

async function handleDislike() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        if (isDisliked) {
            await supabase
                .from('video_interactions')
                .delete()
                .eq('user_id', user.id)
                .eq('video_id', currentVideo.id);
        } else {
            await supabase
                .from('video_interactions')
                .upsert({
                    user_id: user.id,
                    video_id: currentVideo.id,
                    type: 'dislike'
                });
        }

        isDisliked = !isDisliked;
        isLiked = false;
        updateLikeButtons();
    } catch (error) {
        console.error('Error handling dislike:', error);
        showError('Failed to update dislike');
    }
}

async function handleSave() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        if (isSaved) {
            await supabase
                .from('saved_videos')
                .delete()
                .eq('user_id', user.id)
                .eq('video_id', currentVideo.id);
        } else {
            await supabase
                .from('saved_videos')
                .insert({
                    user_id: user.id,
                    video_id: currentVideo.id,
                    created_at: new Date().toISOString()
                });
        }

        isSaved = !isSaved;
        updateSaveButton();
    } catch (error) {
        console.error('Error handling save:', error);
        showError('Failed to update save status');
    }
}

async function handleComment() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        const content = commentInput.value.trim();
        if (!content) return;

        await supabase
            .from('comments')
            .insert({
                user_id: user.id,
                video_id: currentVideo.id,
                content,
                created_at: new Date().toISOString()
            });

        commentInput.value = '';
        await loadComments();
    } catch (error) {
        console.error('Error handling comment:', error);
        showError('Failed to post comment');
    }
}

function handleShowMore() {
    isDescriptionExpanded = !isDescriptionExpanded;
    videoDescription.style.maxHeight = isDescriptionExpanded ? 'none' : '3em';
    showMoreBtn.textContent = isDescriptionExpanded ? 'Show less' : 'Show more';
}

function handleShare() {
    shareModal.show();
}

function handleCopyLink() {
    videoLink.select();
    document.execCommand('copy');
    showSuccess('Link copied to clipboard');
}

// Show success message
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

// Show error message
function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

// Event Listeners
subscribeBtn.addEventListener('click', handleSubscribe);
likeBtn.addEventListener('click', handleLike);
dislikeBtn.addEventListener('click', handleDislike);
saveBtn.addEventListener('click', handleSave);
shareBtn.addEventListener('click', handleShare);
showMoreBtn.addEventListener('click', handleShowMore);
submitCommentBtn.addEventListener('click', handleComment);
cancelCommentBtn.addEventListener('click', () => {
    commentInput.value = '';
});
copyLinkBtn.addEventListener('click', handleCopyLink);

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initPage); 