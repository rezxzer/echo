// DOM Elements
const featuredVideos = document.getElementById('featuredVideos');
const categories = document.getElementById('categories');
const popularTags = document.getElementById('popularTags');
const recommendedVideos = document.getElementById('recommendedVideos');
const userSubscription = document.getElementById('userSubscription');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const subscriptionModal = new bootstrap.Modal(document.getElementById('subscriptionModal'));
const subscriptionPlans = document.getElementById('subscriptionPlans');

// State
let currentFilter = 'trending';
let currentUser = null;
let userSubscriptionStatus = null;

// Initialize page
async function initPage() {
    try {
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            currentUser = user;
            await loadUserProfile();
            await loadUserSubscription();
        }

        // Load content
        await Promise.all([
            loadFeaturedVideos(),
            loadCategories(),
            loadPopularTags(),
            loadRecommendedVideos()
        ]);

        // Add event listeners
        addEventListeners();
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('Failed to load page content');
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const { data: profile, error } = await supabase
            .from('users')
            .select('username, avatar_url')
            .eq('id', currentUser.id)
            .single();

        if (error) throw error;

        userName.textContent = profile.username;
        userAvatar.src = profile.avatar_url || 'https://via.placeholder.com/24';
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Load user subscription
async function loadUserSubscription() {
    try {
        userSubscriptionStatus = await window.monetizationService.getUserSubscription();
        
        if (userSubscriptionStatus?.status === 'active') {
            userSubscription.innerHTML = `
                <span class="badge bg-success">
                    <i class="fas fa-crown me-1"></i>
                    Premium
                </span>
            `;
        } else {
            userSubscription.innerHTML = `
                <button class="btn btn-sm btn-outline-warning" onclick="showSubscriptionModal()">
                    <i class="fas fa-crown me-1"></i>
                    Upgrade
                </button>
            `;
        }
    } catch (error) {
        console.error('Error loading user subscription:', error);
    }
}

// Load featured videos
async function loadFeaturedVideos() {
    try {
        let query = supabase
            .from('videos')
            .select('*, users(*)')
            .order('created_at', { ascending: false });

        switch (currentFilter) {
            case 'trending':
                query = query.order('views', { ascending: false });
                break;
            case 'popular':
                query = query.order('likes', { ascending: false });
                break;
        }

        const { data: videos, error } = await query.limit(6);

        if (error) throw error;

        featuredVideos.innerHTML = videos.map(video => `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <img src="${video.thumbnail_url}" 
                         alt="${video.title}" 
                         class="card-img-top" 
                         style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${video.title}</h5>
                        <p class="card-text text-muted">
                            <small>
                                <i class="fas fa-user me-1"></i>${video.users.username}
                                <br>
                                <i class="fas fa-eye me-1"></i>${video.views || 0} views
                                <br>
                                <i class="fas fa-calendar me-1"></i>${new Date(video.created_at).toLocaleDateString()}
                            </small>
                        </p>
                        <a href="video.html?id=${video.id}" class="btn btn-primary">Watch Now</a>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading featured videos:', error);
        showError('Failed to load featured videos');
    }
}

// Load categories
async function loadCategories() {
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) throw error;

        categories.innerHTML = categories.map(category => `
            <div class="col-md-3 mb-4">
                <a href="category.html?id=${category.id}" class="text-decoration-none">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <i class="${category.icon} fa-2x mb-3 text-primary"></i>
                            <h5 class="card-title">${category.name}</h5>
                            <p class="card-text text-muted">${category.video_count || 0} videos</p>
                        </div>
                    </div>
                </a>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Failed to load categories');
    }
}

// Load popular tags
async function loadPopularTags() {
    try {
        const { data: tags, error } = await supabase
            .from('tags')
            .select('*')
            .order('usage_count', { ascending: false })
            .limit(10);

        if (error) throw error;

        popularTags.innerHTML = tags.map(tag => `
            <a href="tag.html?id=${tag.id}" class="btn btn-outline-primary">
                #${tag.name}
                <span class="badge bg-light text-dark ms-1">${tag.usage_count}</span>
            </a>
        `).join('');
    } catch (error) {
        console.error('Error loading popular tags:', error);
        showError('Failed to load popular tags');
    }
}

// Load recommended videos
async function loadRecommendedVideos() {
    try {
        if (!currentUser) {
            // If user is not logged in, show popular videos
            const { data: videos, error } = await supabase
                .from('videos')
                .select('*, users(*)')
                .order('views', { ascending: false })
                .limit(6);

            if (error) throw error;

            recommendedVideos.innerHTML = videos.map(video => createVideoCard(video)).join('');
            return;
        }

        // Get user's watch history and preferences
        const { data: history, error: historyError } = await supabase
            .from('watch_history')
            .select('video_id')
            .eq('user_id', currentUser.id)
            .order('watched_at', { ascending: false })
            .limit(10);

        if (historyError) throw historyError;

        // Get video IDs from history
        const videoIds = history.map(h => h.video_id);

        // Get recommended videos based on watch history
        const { data: videos, error } = await supabase
            .from('videos')
            .select('*, users(*)')
            .in('category_id', videoIds)
            .neq('id', videoIds)
            .order('views', { ascending: false })
            .limit(6);

        if (error) throw error;

        recommendedVideos.innerHTML = videos.map(video => createVideoCard(video)).join('');
    } catch (error) {
        console.error('Error loading recommended videos:', error);
        showError('Failed to load recommended videos');
    }
}

// Create video card
function createVideoCard(video) {
    return `
        <div class="col-md-4 mb-4">
            <div class="card h-100">
                <img src="${video.thumbnail_url}" 
                     alt="${video.title}" 
                     class="card-img-top" 
                     style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${video.title}</h5>
                    <p class="card-text text-muted">
                        <small>
                            <i class="fas fa-user me-1"></i>${video.users.username}
                            <br>
                            <i class="fas fa-eye me-1"></i>${video.views || 0} views
                            <br>
                            <i class="fas fa-calendar me-1"></i>${new Date(video.created_at).toLocaleDateString()}
                        </small>
                    </p>
                    <a href="video.html?id=${video.id}" class="btn btn-primary">Watch Now</a>
                </div>
            </div>
        </div>
    `;
}

// Show subscription modal
function showSubscriptionModal() {
    const plans = window.monetizationService.getSubscriptionPlans();
    
    subscriptionPlans.innerHTML = plans.map(plan => `
        <div class="card mb-3 ${userSubscriptionStatus?.plan_id === plan.id ? 'border-primary' : ''}">
            <div class="card-body">
                <h4 class="card-title">${plan.name}</h4>
                <h2 class="text-primary">$${plan.price}/month</h2>
                <ul class="list-unstyled mt-3">
                    ${plan.features.map(feature => `
                        <li><i class="fas fa-check text-success me-2"></i>${feature}</li>
                    `).join('')}
                </ul>
                <button class="btn btn-primary w-100" 
                        onclick="subscribeToPlan('${plan.id}')"
                        ${userSubscriptionStatus?.plan_id === plan.id ? 'disabled' : ''}>
                    ${userSubscriptionStatus?.plan_id === plan.id ? 'Current Plan' : 'Subscribe'}
                </button>
            </div>
        </div>
    `).join('');

    subscriptionModal.show();
}

// Subscribe to plan
async function subscribeToPlan(planId) {
    try {
        await window.monetizationService.subscribeToPlan(planId);
        await loadUserSubscription();
        subscriptionModal.hide();
        showSuccess('Successfully subscribed to plan');
    } catch (error) {
        console.error('Error subscribing to plan:', error);
        showError('Failed to subscribe to plan');
    }
}

// Handle logout
async function handleLogout() {
    try {
        await supabase.auth.signOut();
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Error logging out:', error);
        showError('Failed to log out');
    }
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

// Add event listeners
function addEventListeners() {
    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('[data-filter]').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            loadFeaturedVideos();
        });
    });

    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initPage); 