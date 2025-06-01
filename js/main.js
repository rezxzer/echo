// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('საიტი წარმატებით ჩაიტვირთა!');
    
    // Add smooth scrolling to all links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // User Registration
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate passwords match
            const password = this.querySelector('#password').value;
            const confirmPassword = this.querySelector('#confirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('პაროლები არ ემთხვევა!');
                return;
            }
            
            const formData = new FormData(this);
            
            // Here you would typically send the data to a server
            console.log('User registered:', Object.fromEntries(formData));
            
            // For demo purposes, we'll just redirect to the profile page
            window.location.href = 'profile.html';
        });
    }

    // Profile Management
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            
            // Here you would typically send the data to a server
            console.log('Profile updated:', Object.fromEntries(formData));
            
            // Update the profile display
            const username = formData.get('username');
            const email = formData.get('email');
            const bio = formData.get('bio');
            
            document.querySelector('.card-title').textContent = username;
            document.querySelector('.text-muted').textContent = `ელ-ფოსტა: ${email}`;
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
            modal.hide();
        });
    }

    // Avatar Upload
    const avatarForm = document.getElementById('avatarForm');
    if (avatarForm) {
        avatarForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            
            // Here you would typically send the data to a server
            console.log('Avatar uploaded:', Object.fromEntries(formData));
            
            // For demo purposes, we'll just update the image
            const file = formData.get('avatar');
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.querySelector('.avatar-container img').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('avatarModal'));
            modal.hide();
        });
    }

    // Video scrolling functionality
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
        let isScrolling = false;
        let startY;
        let scrollTop;

        videoContainer.addEventListener('mousedown', (e) => {
            isScrolling = true;
            startY = e.pageY - videoContainer.offsetTop;
            scrollTop = videoContainer.scrollTop;
        });

        videoContainer.addEventListener('mousemove', (e) => {
            if (!isScrolling) return;
            e.preventDefault();
            const y = e.pageY - videoContainer.offsetTop;
            const walk = (y - startY) * 2;
            videoContainer.scrollTop = scrollTop - walk;
        });

        videoContainer.addEventListener('mouseup', () => {
            isScrolling = false;
        });

        videoContainer.addEventListener('mouseleave', () => {
            isScrolling = false;
        });
    }

    // Post upload functionality
    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            
            // Here you would typically send the data to a server
            console.log('Post uploaded:', Object.fromEntries(formData));
            
            // For demo purposes, we'll just add the post to the page
            const postsContainer = document.querySelector('.posts-container');
            if (postsContainer) {
                const newPost = createPostElement(formData);
                postsContainer.prepend(newPost);
                this.reset();
            }
        });
    }

    // Like functionality
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('like-btn') || e.target.closest('.like-btn')) {
            const likeBtn = e.target.classList.contains('like-btn') ? e.target : e.target.closest('.like-btn');
            const postId = likeBtn.dataset.postId;
            const likeCount = likeBtn.querySelector('.like-count');
            if (likeCount) {
                let count = parseInt(likeCount.textContent);
                likeCount.textContent = likeBtn.classList.contains('liked') ? count - 1 : count + 1;
                likeBtn.classList.toggle('liked');
            }
        }
    });

    // Comment functionality
    document.addEventListener('submit', function(e) {
        if (e.target.classList.contains('comment-form')) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const postId = e.target.dataset.postId;
            const commentsContainer = document.querySelector(`#comments-${postId}`);
            
            if (commentsContainer) {
                const newComment = createCommentElement(formData);
                commentsContainer.appendChild(newComment);
                e.target.reset();
            }
        }
    });

    // Content Management (Edit/Delete)
    document.addEventListener('click', function(e) {
        // Edit buttons
        if (e.target.classList.contains('fa-edit') || e.target.closest('.fa-edit')) {
            const editBtn = e.target.classList.contains('fa-edit') ? e.target : e.target.closest('.fa-edit');
            const contentCard = editBtn.closest('.card');
            // Here you would typically show an edit modal
            console.log('Edit content:', contentCard);
        }
        
        // Delete buttons
        if (e.target.classList.contains('fa-trash') || e.target.closest('.fa-trash')) {
            const deleteBtn = e.target.classList.contains('fa-trash') ? e.target : e.target.closest('.fa-trash');
            const contentCard = deleteBtn.closest('.card');
            if (confirm('დარწმუნებული ხართ, რომ გსურთ ამ კონტენტის წაშლა?')) {
                contentCard.remove();
            }
        }
    });

    // Terms and conditions validation
    const termsCheck = document.getElementById('termsCheck');
    const termsEmoji = document.querySelector('.terms-emoji');

    if (termsCheck && termsEmoji && registerForm) {
        termsCheck.addEventListener('change', function() {
            if (this.checked) {
                termsEmoji.textContent = '😊';
                termsEmoji.style.animation = 'emojiPop 0.5s ease-in-out';
            } else {
                termsEmoji.textContent = '😢';
                termsEmoji.style.animation = 'emojiShake 0.5s ease-in-out';
            }
        });

        registerForm.addEventListener('submit', function(event) {
            if (!termsCheck.checked) {
                event.preventDefault();
                termsEmoji.textContent = '😢';
                termsEmoji.style.animation = 'emojiShake 0.5s ease-in-out';
                termsCheck.classList.add('is-invalid');
            } else {
                termsCheck.classList.remove('is-invalid');
            }
        });
    }

    // Particle effect for echo brand
    const echoBrand = document.querySelector('.echo-brand');
    
    if (echoBrand) {
        echoBrand.addEventListener('mouseover', function(e) {
            createParticles(e);
        });
    }
    
    function createParticles(e) {
        const brand = e.currentTarget;
        const rect = brand.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random angle and distance
            const angle = (i / 12) * Math.PI * 2;
            const distance = 50 + Math.random() * 50;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            particle.style.setProperty('--x', `${x}px`);
            particle.style.setProperty('--y', `${y}px`);
            
            // Random color
            const colors = ['#ff4d4d', '#ff8533', '#ffcc00'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            brand.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                particle.remove();
            }, 600);
        }
    }

    // Particle Animation
    function createParticles() {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random position
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            
            // Random size
            const size = Math.random() * 4 + 2;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            
            // Random animation duration
            const duration = Math.random() * 20 + 10;
            particle.style.animationDuration = duration + 's';
            
            // Random delay
            particle.style.animationDelay = Math.random() * 5 + 's';
            
            particlesContainer.appendChild(particle);
        }
    }

    // Initialize particles when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        createParticles();
    });

    // Video Gallery Functionality
    function initVideoGallery() {
        const videoModal = new bootstrap.Modal(document.getElementById('videoModal'));
        const videoIframe = document.querySelector('#videoModal iframe');
        const modalTitle = document.querySelector('#videoModal .modal-title');

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        const videoCards = document.querySelectorAll('.video-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');

                const filter = button.dataset.filter;
                
                videoCards.forEach(card => {
                    if (filter === 'all' || card.dataset.category === filter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // Play button click
        document.querySelectorAll('.play-button').forEach(button => {
            button.addEventListener('click', () => {
                const videoId = button.dataset.videoId;
                const videoCard = button.closest('.video-card');
                const videoTitle = videoCard.querySelector('.video-title').textContent;

                // Update modal content
                videoIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                modalTitle.textContent = videoTitle;

                // Show modal
                videoModal.show();
            });
        });

        // Close modal and stop video
        document.getElementById('videoModal').addEventListener('hidden.bs.modal', () => {
            videoIframe.src = '';
        });

        // Video actions
        document.querySelectorAll('.video-action-btn').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.querySelector('i').className;
                
                if (action.includes('heart')) {
                    button.classList.toggle('active');
                    const icon = button.querySelector('i');
                    icon.classList.toggle('fas');
                    icon.classList.toggle('far');
                } else if (action.includes('share')) {
                    // Implement share functionality
                    navigator.clipboard.writeText(window.location.href)
                        .then(() => alert('ბმული დაკოპირებულია!'))
                        .catch(err => console.error('Error copying link:', err));
                } else if (action.includes('comment')) {
                    // Implement comment functionality
                    const commentSection = document.createElement('div');
                    commentSection.className = 'comments-section mt-3';
                    commentSection.innerHTML = `
                        <div class="input-group">
                            <input type="text" class="form-control" placeholder="დაწერეთ კომენტარი...">
                            <button class="btn btn-primary">გაგზავნა</button>
                        </div>
                    `;
                    button.closest('.modal-footer').appendChild(commentSection);
                }
            });
        });
    }

    // Initialize video gallery when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        initVideoGallery();
    });

    // Posts Gallery Functionality
    function initPostsGallery() {
        const postModal = new bootstrap.Modal(document.getElementById('postModal'));
        const modalTitle = document.querySelector('#postModal .modal-title');
        const modalContent = document.querySelector('#postModal .post-content p');

        // Filter buttons
        const filterButtons = document.querySelectorAll('.post-filter-btn');
        const postCards = document.querySelectorAll('.post-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');

                const filter = button.dataset.filter;
                
                postCards.forEach(card => {
                    if (filter === 'all' || card.dataset.category === filter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // Post card click
        postCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't open modal if clicking on action buttons
                if (e.target.closest('.post-action-btn')) return;

                const postTitle = card.querySelector('.post-title').textContent;
                const postText = card.querySelector('.post-text').textContent;

                // Update modal content
                modalTitle.textContent = postTitle;
                modalContent.textContent = postText;

                // Show modal
                postModal.show();
            });
        });

        // Post actions
        document.querySelectorAll('.post-action-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent modal from opening
                const action = button.querySelector('i').className;
                const postId = button.dataset.postId;
                
                if (action.includes('heart')) {
                    button.classList.toggle('active');
                    const icon = button.querySelector('i');
                    icon.classList.toggle('fas');
                    icon.classList.toggle('far');
                    
                    // Update like count
                    const likeCount = button.closest('.post-card').querySelector('.post-stat i.fa-heart').nextSibling;
                    let count = parseInt(likeCount.textContent);
                    likeCount.textContent = button.classList.contains('active') ? count + 1 : count - 1;
                } else if (action.includes('share')) {
                    // Implement share functionality
                    navigator.clipboard.writeText(window.location.href)
                        .then(() => alert('ბმული დაკოპირებულია!'))
                        .catch(err => console.error('Error copying link:', err));
                } else if (action.includes('comment')) {
                    // Open modal with comment section
                    const postCard = button.closest('.post-card');
                    const postTitle = postCard.querySelector('.post-title').textContent;
                    const postText = postCard.querySelector('.post-text').textContent;

                    modalTitle.textContent = postTitle;
                    modalContent.textContent = postText;

                    // Focus on comment input
                    postModal.show();
                    setTimeout(() => {
                        document.querySelector('#postModal .comment-form input').focus();
                    }, 500);
                }
            });
        });

        // Comment form submission
        document.querySelectorAll('.comment-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = form.querySelector('input');
                const comment = input.value.trim();
                
                if (comment) {
                    const commentsList = form.closest('.comments-section').querySelector('.comments-list');
                    const newComment = createCommentElement(comment);
                    commentsList.appendChild(newComment);
                    input.value = '';
                }
            });
        });
    }

    // Initialize posts gallery when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        initPostsGallery();
    });

    // Registration Form Functionality
    initRegistrationForm();

    // Login Form Functionality
    initLoginForm();

    // Profile Page Functionality
    // Profile Edit Modal
    const profileEditBtn = document.querySelector('.edit-profile');
    const profileEditModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    const profileSaveBtn = document.getElementById('saveProfile');
    const profileEditForm = document.getElementById('editProfileForm');

    if (profileEditBtn) {
        profileEditBtn.addEventListener('click', () => {
            profileEditModal.show();
        });
    }

    if (profileSaveBtn) {
        profileSaveBtn.addEventListener('click', () => {
            const formData = new FormData(profileEditForm);
            const profileData = Object.fromEntries(formData.entries());
            
            // Update profile information
            document.querySelector('.profile-name').textContent = profileData.name;
            document.querySelector('.profile-bio').textContent = profileData.bio;
            
            // Update sidebar information
            const sidebarItems = document.querySelectorAll('.profile-sidebar ul li span');
            sidebarItems[0].textContent = profileData.email;
            sidebarItems[1].textContent = profileData.phone;
            sidebarItems[2].textContent = profileData.location;
            
            profileEditModal.hide();
        });
    }

    // Avatar and Cover Photo Upload
    const avatarEditBtn = document.querySelector('.edit-avatar');
    const coverEditBtn = document.querySelector('.edit-cover');

    if (avatarEditBtn) {
        avatarEditBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        document.querySelector('.avatar').src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        });
    }

    if (coverEditBtn) {
        coverEditBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        document.querySelector('.cover-photo').src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        });
    }

    // Post Creation
    const profilePostForm = document.querySelector('.post-form');
    const profilePostTextarea = profilePostForm?.querySelector('textarea');
    const profilePostButton = profilePostForm?.querySelector('button');

    if (profilePostButton && profilePostTextarea) {
        profilePostButton.addEventListener('click', () => {
            const postText = profilePostTextarea.value.trim();
            if (postText) {
                const postsList = document.querySelector('.posts-list');
                const newPost = createPostElement(postText);
                postsList.insertBefore(newPost, postsList.firstChild);
                profilePostTextarea.value = '';
            }
        });
    }

    // Like and Comment Functionality
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-light')) {
            const button = e.target.closest('.btn-light');
            if (button.querySelector('.fa-heart')) {
                button.classList.toggle('active');
                const likeCount = button.querySelector('span');
                if (likeCount) {
                    const currentCount = parseInt(likeCount.textContent);
                    likeCount.textContent = button.classList.contains('active') ? currentCount + 1 : currentCount - 1;
                }
            }
        }
    });

    // Handle search
    function handleSearch() {
        const searchQuery = document.getElementById('searchInput').value.trim();
        loadContent(1, searchQuery);
    }

    // Handle search input enter key
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Particle animation
    const particles = document.querySelectorAll('.particle');
    
    particles.forEach(particle => {
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
        particle.style.animationDelay = Math.random() * 2 + 's';
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(26, 26, 26, 0.95)';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'transparent';
            navbar.style.boxShadow = 'none';
        }
    });

    // Add active class to nav links based on scroll position
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelector('.nav-link[href*=' + sectionId + ']').classList.add('active');
            } else {
                document.querySelector('.nav-link[href*=' + sectionId + ']').classList.remove('active');
            }
        });
    });

    // Video Management Functions
    let currentPage = 1;
    const itemsPerPage = 12;

    async function loadVideos(page = 1, searchQuery = '') {
        try {
            const { data: videos, error, count } = await supabase
                .from('videos')
                .select('*, profiles(username)', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

            if (error) throw error;

            const videoGrid = document.getElementById('videoGrid');
            videoGrid.innerHTML = '';

            if (videos.length === 0) {
                videoGrid.innerHTML = `
                    <div class="col-12 text-center">
                        <p class="text-muted">No videos found</p>
                    </div>
                `;
                return;
            }

            videos.forEach(video => {
                const videoCard = createVideoCard(video);
                videoGrid.appendChild(videoCard);
            });

            updatePagination(page, count, itemsPerPage);
        } catch (error) {
            console.error('Error loading videos:', error);
            showError('Failed to load videos. Please try again later.');
        }
    }

    function createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail_url || 'placeholder.jpg'}" alt="${video.title}">
                <span class="video-duration">${formatDuration(video.duration)}</span>
            </div>
            <div class="video-info">
                <h3 class="video-title">${video.title}</h3>
                <div class="video-meta">
                    <div class="video-views">
                        <i class="fas fa-eye"></i>
                        <span>${formatViews(video.views)}</span>
                    </div>
                    <span class="video-date">${formatDate(video.created_at)}</span>
                </div>
                <div class="video-author">
                    <small class="text-muted">Posted by ${video.profiles?.username || 'Unknown'}</small>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            window.location.href = `/video.html?id=${video.id}`;
        });

        return card;
    }

    function formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

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

    function updatePagination(currentPage, totalItems, itemsPerPage) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => loadVideos(currentPage - 1));
        pagination.appendChild(prevButton);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - 2 && i <= currentPage + 2)
            ) {
                const pageButton = document.createElement('button');
                pageButton.textContent = i;
                pageButton.className = i === currentPage ? 'active' : '';
                pageButton.addEventListener('click', () => loadVideos(i));
                pagination.appendChild(pageButton);
            } else if (
                i === currentPage - 3 ||
                i === currentPage + 3
            ) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                pagination.appendChild(ellipsis);
            }
        }

        // Next button
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => loadVideos(currentPage + 1));
        pagination.appendChild(nextButton);
    }

    // Search functionality
    let searchTimeout;
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchQuery = e.target.value.trim();
                currentPage = 1;
                loadVideos(currentPage, searchQuery);
            }, 300);
        });
    }

    // Load videos on page load
    document.addEventListener('DOMContentLoaded', () => {
        loadVideos(currentPage);
    });
});

// Helper function to create a post element
function createPostElement(text) {
    const postDiv = document.createElement('div');
    postDiv.className = 'card mb-4';
    postDiv.innerHTML = `
        <div class="card-body">
            <div class="d-flex align-items-center mb-3">
                <img src="https://source.unsplash.com/random/50x50" alt="User" class="rounded-circle me-2" width="40">
                <div>
                    <h6 class="mb-0">სახელი გვარი</h6>
                    <small class="text-muted">ახლა</small>
                </div>
            </div>
            <p class="card-text">${text}</p>
            <div class="post-actions">
                <button class="btn btn-light btn-sm">
                    <i class="fas fa-heart"></i> 0
                </button>
                <button class="btn btn-light btn-sm">
                    <i class="fas fa-comment"></i> 0
                </button>
                <button class="btn btn-light btn-sm">
                    <i class="fas fa-share"></i> გაზიარება
                </button>
            </div>
        </div>
    `;
    return postDiv;
}

// Helper function to create a comment element
function createCommentElement(formData) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment mb-2';
    commentDiv.innerHTML = `
        <div class="d-flex align-items-start">
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">მომხმარებელი</h6>
                    <small class="text-muted">ახლა</small>
                </div>
                <p class="mb-0">${formData.get('comment')}</p>
            </div>
        </div>
    `;
    return commentDiv;
}

// Registration Form Functionality
function initRegistrationForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const strengthBar = document.querySelector('.password-strength-bar');
    const termsCheck = document.getElementById('termsCheck');

    // Password strength indicator
    password.addEventListener('input', function() {
        const value = this.value;
        let strength = 0;
        
        if (value.length >= 8) strength += 25;
        if (value.match(/[a-z]+/)) strength += 25;
        if (value.match(/[A-Z]+/)) strength += 25;
        if (value.match(/[0-9]+/)) strength += 25;
        
        strengthBar.style.width = strength + '%';
        
        if (strength <= 25) {
            strengthBar.style.backgroundColor = '#ff4444';
        } else if (strength <= 50) {
            strengthBar.style.backgroundColor = '#ffbb33';
        } else if (strength <= 75) {
            strengthBar.style.backgroundColor = '#00C851';
        } else {
            strengthBar.style.backgroundColor = '#007E33';
        }
    });

    // Password confirmation validation
    confirmPassword.addEventListener('input', function() {
        if (this.value !== password.value) {
            this.setCustomValidity('პაროლები არ ემთხვევა');
        } else {
            this.setCustomValidity('');
        }
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        // Simulate form submission
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> რეგისტრაცია...';

        // Simulate API call
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'დარეგისტრირდი <span class="emoji-container"><span class="emoji">👋</span><span class="emoji">😊</span><span class="emoji">✨</span></span>';
            
            // Show success message
            const successAlert = document.createElement('div');
            successAlert.className = 'alert alert-success mt-3';
            successAlert.innerHTML = `
                <i class="fas fa-check-circle"></i>
                რეგისტრაცია წარმატებით დასრულდა!
                <span class="emoji">🎉</span>
            `;
            form.insertAdjacentElement('beforebegin', successAlert);

            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }, 2000);
    });

    // Social login buttons
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const provider = this.classList.contains('facebook') ? 'Facebook' :
                           this.classList.contains('google') ? 'Google' : 'Twitter';
            
            // Simulate social login
            const originalContent = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            setTimeout(() => {
                this.innerHTML = originalContent;
                alert(`${provider}-ით შესვლა მალე ხელმისაწვდომი იქნება!`);
            }, 1000);
        });
    });
}

// Login Form Functionality
function initLoginForm() {
    const loginForm = document.querySelector('.login-form');
    if (!loginForm) return;

    const passwordInput = loginForm.querySelector('#password');
    const togglePassword = loginForm.querySelector('.toggle-password');
    const rememberMe = loginForm.querySelector('#rememberMe');
    const forgotPassword = loginForm.querySelector('.forgot-password');

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.querySelector('i').classList.toggle('fa-eye');
            togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // Remember me functionality
    if (rememberMe) {
        // Check if there's a saved email
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            loginForm.querySelector('#email').value = savedEmail;
            rememberMe.checked = true;
        }

        rememberMe.addEventListener('change', (e) => {
            if (e.target.checked) {
                const email = loginForm.querySelector('#email').value;
                if (email) {
                    localStorage.setItem('rememberedEmail', email);
                }
            } else {
                localStorage.removeItem('rememberedEmail');
            }
        });
    }

    // Forgot password functionality
    if (forgotPassword) {
        forgotPassword.addEventListener('click', (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('#email').value;
            if (!email) {
                alert('გთხოვთ შეიყვანოთ თქვენი ელ-ფოსტა პაროლის აღსადგენად');
                return;
            }
            // Here you would typically make an API call to send a password reset email
            alert('პაროლის აღდგენის ბმული გაიგზავნა თქვენს ელ-ფოსტაზე');
        });
    }

    // Form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!loginForm.checkValidity()) {
            e.stopPropagation();
            loginForm.classList.add('was-validated');
            return;
        }

        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> შესვლა...';

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Here you would typically make an actual API call to authenticate the user
            const email = loginForm.querySelector('#email').value;
            const password = loginForm.querySelector('#password').value;

            // For demo purposes, we'll just show a success message
            alert('წარმატებით შეხვედით სისტემაში!');
            
            // Redirect to home page
            window.location.href = '/index.html';
        } catch (error) {
            alert('შეცდომა მოხდა. გთხოვთ სცადოთ მოგვიანებით.');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    });
}

// Temporary test user
const testUser = {
    id: 1,
    username: "test_user",
    email: "test@example.com",
    password: "Test123!",
    fullName: "ტესტ მომხმარებელი",
    avatar: "https://via.placeholder.com/150",
    coverPhoto: "https://via.placeholder.com/1200x400",
    bio: "ეს არის სატესტო მომხმარებელი",
    joinDate: "2024-03-20",
    posts: [
        {
            id: 1,
            content: "ეს არის სატესტო პოსტი #1",
            image: "https://via.placeholder.com/600x400",
            likes: 15,
            comments: 5,
            date: "2024-03-20"
        },
        {
            id: 2,
            content: "ეს არის სატესტო პოსტი #2",
            video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            likes: 25,
            comments: 8,
            date: "2024-03-21"
        }
    ],
    videos: [
        {
            id: 1,
            title: "სატესტო ვიდეო #1",
            description: "ეს არის სატესტო ვიდეოს აღწერა",
            thumbnail: "https://via.placeholder.com/300x200",
            url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            views: 150,
            likes: 30,
            date: "2024-03-20"
        }
    ],
    photos: [
        {
            id: 1,
            url: "https://via.placeholder.com/400x400",
            description: "სატესტო ფოტო #1",
            likes: 20,
            date: "2024-03-20"
        },
        {
            id: 2,
            url: "https://via.placeholder.com/400x400",
            description: "სატესტო ფოტო #2",
            likes: 15,
            date: "2024-03-21"
        }
    ],
    followers: 100,
    following: 50,
    isPremium: true
};

// Function to simulate login
function loginTestUser() {
    localStorage.setItem('currentUser', JSON.stringify(testUser));
    window.location.href = 'profile.html';
}

// Check authentication status
async function checkAuth() {
    const user = await window.supabaseClient.getCurrentUser();
    if (user) {
        document.querySelector('.auth-buttons').innerHTML = `
            <div class="dropdown">
                <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user"></i> ${user.profile.username}
                </button>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="pages/profile.html">პროფილი</a></li>
                    <li><a class="dropdown-item" href="pages/settings.html">პარამეტრები</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="logout()">გასვლა</a></li>
                </ul>
            </div>
        `;
    }
}

// Logout function
async function logout() {
    try {
        const { error } = await window.supabaseClient.logout();
        if (error) throw error;
        window.location.reload();
    } catch (error) {
        alert('გასვლის შეცდომა: ' + error.message);
    }
}

// Load content
async function loadContent(page = 1, searchQuery = '') {
    try {
        const activeFilter = document.querySelector('.btn-group .active').dataset.type;
        const { data, error, count } = await window.supabaseClient.fetchContent(activeFilter, page, searchQuery);
        if (error) throw error;

        const contentContainer = document.getElementById('contentContainer');
        if (data.length === 0) {
            contentContainer.innerHTML = '<p class="text-center">კონტენტი ვერ მოიძებნა</p>';
            return;
        }

        contentContainer.innerHTML = data.map(content => `
            <div class="card mb-4">
                <div class="card-body">
                    <h5 class="card-title">${content.title}</h5>
                    <div class="d-flex align-items-center mb-3">
                        <img src="${content.profiles.avatar_url || 'assets/default-avatar.png'}" 
                             class="rounded-circle me-2" 
                             style="width: 40px; height: 40px;" 
                             alt="${content.profiles.username}">
                        <div>
                            <div class="fw-bold">${content.profiles.username}</div>
                            <small class="text-muted">${new Date(content.created_at).toLocaleDateString('ka-GE')}</small>
                        </div>
                    </div>
                    ${content.type === 'video' ? `
                        <video controls class="img-fluid mb-3">
                            <source src="${content.media}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    ` : content.media ? `
                        <img src="${content.media}" class="img-fluid mb-3" alt="${content.title}">
                    ` : ''}
                    <p class="card-text">${content.content}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <button class="btn btn-outline-primary me-2" onclick="handleLike('${content.id}')">
                                <i class="fas fa-heart"></i> ${content.likes?.length || 0}
                            </button>
                            <span class="text-muted">
                                <i class="fas fa-eye"></i> ${content.views || 0}
                            </span>
                        </div>
                        <a href="pages/content.html?id=${content.id}" class="btn btn-primary">
                            <i class="fas fa-eye"></i> ნახვა
                        </a>
                    </div>
                    ${content.tags?.length ? `
                        <div class="mt-3">
                            ${content.tags.map(tag => `
                                <span class="badge bg-secondary me-1">${tag}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Update pagination
        updatePagination(page, count);
    } catch (error) {
        console.error('Error loading content:', error);
        alert('კონტენტის ჩვენების შეცდომა: ' + error.message);
    }
}

// Update pagination UI
function updatePagination(currentPage, totalCount) {
    const itemsPerPage = 10; // Adjust based on your needs
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    const pagination = document.querySelector('.pagination');
    const prevButton = pagination.querySelector('[data-page="prev"]').parentElement;
    const nextButton = pagination.querySelector('[data-page="next"]').parentElement;
    
    // Update prev/next button states
    prevButton.classList.toggle('disabled', currentPage === 1);
    nextButton.classList.toggle('disabled', currentPage === totalPages);
    
    // Update page numbers
    const pageNumbers = pagination.querySelectorAll('.page-item:not(:first-child):not(:last-child)');
    pageNumbers.forEach(item => item.remove());
    
    const activeFilter = document.querySelector('.content-filters .active').dataset.filter;
    
    // Add page numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `
            <button class="page-link" data-page="${i}">${i}</button>
        `;
        li.querySelector('button').addEventListener('click', () => {
            loadContent(i);
        });
        nextButton.parentElement.insertBefore(li, nextButton);
    }
} 