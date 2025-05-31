// Profile Page JavaScript

// DOM Elements
const postForm = document.querySelector('.post-form');
const postTextarea = postForm.querySelector('textarea');
const photoUploadBtn = postForm.querySelector('.btn-light:nth-child(1)');
const videoUploadBtn = postForm.querySelector('.btn-light:nth-child(2)');
const postsList = document.querySelector('.posts-list');
const editCoverBtn = document.querySelector('.edit-cover');
const editAvatarBtn = document.querySelector('.edit-avatar');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize profile page
    loadUserProfile();
    loadPosts();
});

postForm.addEventListener('submit', (e) => {
    e.preventDefault();
    createPost();
});

photoUploadBtn.addEventListener('click', () => {
    uploadPhoto();
});

videoUploadBtn.addEventListener('click', () => {
    uploadVideo();
});

editCoverBtn.addEventListener('click', () => {
    uploadCoverPhoto();
});

editAvatarBtn.addEventListener('click', () => {
    uploadProfilePhoto();
});

// Functions
function loadUserProfile() {
    // In a real application, this would fetch user data from the server
    const userData = {
        name: 'ტესტ მომხმარებელი',
        bio: 'ეს არის სატესტო მომხმარებელი',
        email: 'test@example.com',
        joinDate: '20 მარტი, 2024',
        location: 'თბილისი, საქართველო',
        followers: 100,
        following: 50,
        isPremium: true
    };

    // Update profile information
    document.querySelector('.profile-name').textContent = userData.name;
    document.querySelector('.profile-bio').textContent = userData.bio;
    document.querySelector('.stat:nth-child(1) span').textContent = `${userData.followers} მიმდევარი`;
    document.querySelector('.stat:nth-child(2) span').textContent = `${userData.following} გამომწერი`;
}

function loadPosts() {
    // In a real application, this would fetch posts from the server
    const posts = [
        {
            id: 1,
            text: 'ეს არის სატესტო პოსტი #1',
            image: 'https://via.placeholder.com/600x400',
            likes: 15,
            comments: 5,
            timestamp: '2 საათის წინ'
        },
        {
            id: 2,
            text: 'ეს არის სატესტო პოსტი #2',
            video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            likes: 25,
            comments: 8,
            timestamp: '5 საათის წინ'
        }
    ];

    // Clear existing posts
    postsList.innerHTML = '';

    // Add posts to the list
    posts.forEach(post => {
        const postElement = createPostElement(post);
        postsList.appendChild(postElement);
    });
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'card mb-4';
    postDiv.innerHTML = `
        <div class="card-body">
            <div class="d-flex align-items-center mb-3">
                <img src="https://via.placeholder.com/50" alt="User" class="rounded-circle me-2" width="40">
                <div>
                    <h6 class="mb-0">ტესტ მომხმარებელი</h6>
                    <small class="text-muted">${post.timestamp}</small>
                </div>
            </div>
            <p class="card-text">${post.text}</p>
            ${post.image ? `<img src="${post.image}" alt="Post Image" class="img-fluid rounded mb-3">` : ''}
            ${post.video ? `
                <div class="ratio ratio-16x9 mb-3">
                    <iframe src="${post.video}" allowfullscreen></iframe>
                </div>
            ` : ''}
            <div class="post-actions">
                <button class="btn btn-light btn-sm like-btn" data-post-id="${post.id}">
                    <i class="fas fa-heart"></i> ${post.likes}
                </button>
                <button class="btn btn-light btn-sm comment-btn" data-post-id="${post.id}">
                    <i class="fas fa-comment"></i> ${post.comments}
                </button>
                <button class="btn btn-light btn-sm share-btn" data-post-id="${post.id}">
                    <i class="fas fa-share"></i> გაზიარება
                </button>
            </div>
        </div>
    `;

    // Add event listeners for post actions
    const likeBtn = postDiv.querySelector('.like-btn');
    const commentBtn = postDiv.querySelector('.comment-btn');
    const shareBtn = postDiv.querySelector('.share-btn');

    likeBtn.addEventListener('click', () => toggleLike(post.id));
    commentBtn.addEventListener('click', () => showComments(post.id));
    shareBtn.addEventListener('click', () => sharePost(post.id));

    return postDiv;
}

function createPost() {
    const text = postTextarea.value.trim();
    if (!text) return;

    // In a real application, this would send the post to the server
    const newPost = {
        id: Date.now(),
        text: text,
        likes: 0,
        comments: 0,
        timestamp: 'ახლა'
    };

    const postElement = createPostElement(newPost);
    postsList.insertBefore(postElement, postsList.firstChild);
    postTextarea.value = '';
}

function toggleLike(postId) {
    const likeBtn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
    const likeCount = likeBtn.querySelector('i').nextSibling;
    const currentLikes = parseInt(likeCount.textContent);
    
    if (likeBtn.classList.contains('liked')) {
        likeBtn.classList.remove('liked');
        likeCount.textContent = ` ${currentLikes - 1}`;
    } else {
        likeBtn.classList.add('liked');
        likeCount.textContent = ` ${currentLikes + 1}`;
    }
}

function showComments(postId) {
    // In a real application, this would show a comments modal or section
    alert('კომენტარების ჩვენება - პოსტი #' + postId);
}

function sharePost(postId) {
    // In a real application, this would show a share dialog
    alert('პოსტის გაზიარება - პოსტი #' + postId);
}

function uploadPhoto() {
    // In a real application, this would open a file picker and upload the photo
    alert('ფოტოს ატვირთვა');
}

function uploadVideo() {
    // In a real application, this would open a file picker and upload the video
    alert('ვიდეოს ატვირთვა');
}

function uploadCoverPhoto() {
    // In a real application, this would open a file picker and upload the cover photo
    alert('საფარის ფოტოს ატვირთვა');
}

function uploadProfilePhoto() {
    // In a real application, this would open a file picker and upload the profile photo
    alert('პროფილის ფოტოს ატვირთვა');
}

// Logout function
function logout() {
    // In a real application, this would clear the session and redirect to login
    window.location.href = '../index.html';
} 