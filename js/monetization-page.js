// DOM Elements
const subscriptionPlansContainer = document.getElementById('subscriptionPlans');
const monetizedVideosTable = document.getElementById('monetizedVideos');
const monthlyEarningsElement = document.getElementById('monthlyEarnings');
const totalEarningsElement = document.getElementById('totalEarnings');
const earningsChart = document.getElementById('earningsChart');
const monetizationModal = new bootstrap.Modal(document.getElementById('monetizationModal'));
const monetizationForm = document.getElementById('monetizationForm');
const saveMonetizationButton = document.getElementById('saveMonetization');

// Chart instance
let earningsChartInstance = null;

// Load subscription plans
async function loadSubscriptionPlans() {
    try {
        const plans = window.monetizationService.getSubscriptionPlans();
        const userSubscription = await window.monetizationService.getUserSubscription();

        subscriptionPlansContainer.innerHTML = plans.map(plan => `
            <div class="card mb-3 ${userSubscription?.plan_id === plan.id ? 'border-primary' : ''}">
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
                            ${userSubscription?.plan_id === plan.id ? 'disabled' : ''}>
                        ${userSubscription?.plan_id === plan.id ? 'Current Plan' : 'Subscribe'}
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading subscription plans:', error);
        showError('Failed to load subscription plans');
    }
}

// Load monetized videos
async function loadMonetizedVideos() {
    try {
        const { data: videos, error } = await supabase
            .from('videos')
            .select('*')
            .eq('user_id', (await supabase.auth.getUser()).data.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        monetizedVideosTable.innerHTML = await Promise.all(videos.map(async video => {
            const monetization = await window.monetizationService.getVideoMonetization(video.id);
            const earnings = await window.monetizationService.calculateEarnings(video.id);

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${video.thumbnail_url}" alt="${video.title}" class="rounded" style="width: 80px; height: 45px; object-fit: cover;">
                            <div class="ms-3">
                                <h6 class="mb-0">${video.title}</h6>
                                <small class="text-muted">${new Date(video.created_at).toLocaleDateString()}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${monetization?.enabled ? 'bg-success' : 'bg-secondary'}">
                            ${monetization?.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </td>
                    <td>$${earnings.total.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="openMonetizationSettings('${video.id}')">
                            Settings
                        </button>
                    </td>
                </tr>
            `;
        })).join('');
    } catch (error) {
        console.error('Error loading monetized videos:', error);
        showError('Failed to load monetized videos');
    }
}

// Load earnings overview
async function loadEarningsOverview() {
    try {
        const earnings = await window.monetizationService.getUserEarnings();
        
        // Calculate monthly and total earnings
        const monthlyEarnings = earnings
            .filter(e => new Date(e.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
            .reduce((sum, e) => sum + e.amount, 0);
        
        const totalEarnings = earnings
            .reduce((sum, e) => sum + e.amount, 0);

        // Update earnings display
        monthlyEarningsElement.textContent = `$${monthlyEarnings.toFixed(2)}`;
        totalEarningsElement.textContent = `$${totalEarnings.toFixed(2)}`;

        // Create earnings chart
        const monthlyData = Array(12).fill(0);
        earnings.forEach(e => {
            const month = new Date(e.date).getMonth();
            monthlyData[month] += e.amount;
        });

        if (earningsChartInstance) {
            earningsChartInstance.destroy();
        }

        earningsChartInstance = new Chart(earningsChart, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Monthly Earnings',
                    data: monthlyData,
                    borderColor: '#1a73e8',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => `$${value}`
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading earnings overview:', error);
        showError('Failed to load earnings overview');
    }
}

// Open monetization settings modal
async function openMonetizationSettings(videoId) {
    try {
        const monetization = await window.monetizationService.getVideoMonetization(videoId);
        
        document.getElementById('videoId').value = videoId;
        document.getElementById('enableAds').checked = monetization?.enabled || false;
        document.getElementById('preRollAds').checked = monetization?.ad_types?.includes('pre-roll') || false;
        document.getElementById('midRollAds').checked = monetization?.ad_types?.includes('mid-roll') || false;
        document.getElementById('postRollAds').checked = monetization?.ad_types?.includes('post-roll') || false;
        document.getElementById('bannerAds').checked = monetization?.ad_types?.includes('banner') || false;

        monetizationModal.show();
    } catch (error) {
        console.error('Error opening monetization settings:', error);
        showError('Failed to load monetization settings');
    }
}

// Save monetization settings
async function saveMonetizationSettings() {
    try {
        const videoId = document.getElementById('videoId').value;
        const settings = {
            enabled: document.getElementById('enableAds').checked,
            ad_types: [
                document.getElementById('preRollAds').checked && 'pre-roll',
                document.getElementById('midRollAds').checked && 'mid-roll',
                document.getElementById('postRollAds').checked && 'post-roll',
                document.getElementById('bannerAds').checked && 'banner'
            ].filter(Boolean)
        };

        await window.monetizationService.updateVideoMonetization(videoId, settings);
        monetizationModal.hide();
        await loadMonetizedVideos();
        showSuccess('Monetization settings updated successfully');
    } catch (error) {
        console.error('Error saving monetization settings:', error);
        showError('Failed to save monetization settings');
    }
}

// Subscribe to a plan
async function subscribeToPlan(planId) {
    try {
        await window.monetizationService.subscribeToPlan(planId);
        await loadSubscriptionPlans();
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

// Event Listeners
saveMonetizationButton.addEventListener('click', saveMonetizationSettings);

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = '/login.html';
    } else {
        await Promise.all([
            loadSubscriptionPlans(),
            loadMonetizedVideos(),
            loadEarningsOverview()
        ]);
    }
}); 