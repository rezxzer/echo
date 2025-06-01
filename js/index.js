// Import required modules
import { supabase } from './supabase.js';
import { testConnection } from './supabase-config.js';

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
        // Test Supabase connection
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Failed to connect to Supabase');
        }

        // Check authentication
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;

        if (session) {
            // User is authenticated
            console.log('User is authenticated:', session.user);
            // Load user profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (profileError) {
                console.error('Error loading profile:', profileError.message);
            } else {
                console.log('User profile loaded:', profile);
                await loadUserProfile(profile);
            }
        } else {
            // User is not authenticated
            console.log('User is not authenticated');
            // Show login form or redirect to login page
            document.getElementById('loginForm').style.display = 'block';
        }

        // Load content
        await loadContent();

        // Add event listeners
        addEventListeners();
    } catch (error) {
        console.error('Error initializing page:', error.message);
        showError('Failed to load page content: ' + error.message);
    }
}

// Load user profile
async function loadUserProfile(profile) {
    try {
        userName.textContent = profile.username;
        userAvatar.src = profile.avatar_url || 'https://via.placeholder.com/32';
    } catch (error) {
        console.error('Error loading user profile:', error);
        showError('Failed to load user profile');
    }
}

// Load user subscription
async function loadUserSubscription() {
    try {
        // For now, just show the upgrade button
        userSubscription.innerHTML = `
            <button class="btn btn-sm btn-outline-warning" onclick="showSubscriptionModal()">
                <i class="fas fa-crown me-1"></i>
                Upgrade
            </button>
        `;
    } catch (error) {
        console.error('Error loading user subscription:', error);
        showError('Failed to load subscription status');
    }
}

// Load content
async function loadContent() {
    try {
        // Load featured videos
        const { data: featuredVideosData, error: videosError } = await supabase
            .from('videos')
            .select('*')
            .eq('featured', true)
            .limit(6);

        if (videosError) throw videosError;
        console.log('Featured videos loaded:', featuredVideosData);

        // Load categories
        const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('*');

        if (categoriesError) throw categoriesError;
        console.log('Categories loaded:', categoriesData);

        // Load popular tags
        const { data: tagsData, error: tagsError } = await supabase
            .from('tags')
            .select('*')
            .order('count', { ascending: false })
            .limit(10);

        if (tagsError) throw tagsError;
        console.log('Popular tags loaded:', tagsData);

        // Load recommended videos
        await loadRecommendedVideos();
    } catch (error) {
        console.error('Error loading content:', error.message);
        showError('Failed to load page content');
    }
}

// Load recommended videos
async function loadRecommendedVideos() {
    try {
        const { data: videos, error } = await supabase
            .from('videos')
            .select('*, profiles(username)')
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
                            <i class="fas fa-user me-1"></i>${video.profiles.username}
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
            loadContent();
        });
    });

    // Logout button
    logoutBtn.addEventListener('click', async () => {
        try {
            await supabase.auth.signOut();
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Error logging out:', error);
            showError('Failed to log out');
        }
    });
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initPage); 