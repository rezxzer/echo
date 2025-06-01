// DOM Elements
const monetizationForm = document.getElementById('monetizationForm');
const subscriptionPlans = document.getElementById('subscriptionPlans');
const totalRevenue = document.getElementById('totalRevenue');
const activeSubscribers = document.getElementById('activeSubscribers');
const adImpressions = document.getElementById('adImpressions');
const conversionRate = document.getElementById('conversionRate');
const revenueChart = document.getElementById('revenueChart');

// State
let currentSettings = null;
let revenueData = null;
let chart = null;

// Initialize admin panel
async function initAdminPanel() {
    try {
        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        const { data: adminData, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (error || !adminData?.is_admin) {
            window.location.href = '/';
            return;
        }

        // Load data
        await Promise.all([
            loadMonetizationSettings(),
            loadSubscriptionPlans(),
            loadPlatformStatistics(),
            loadRevenueData()
        ]);

        // Add event listeners
        addEventListeners();
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        showError('Failed to load admin panel');
    }
}

// Load monetization settings
async function loadMonetizationSettings() {
    try {
        const { data: settings, error } = await supabase
            .from('platform_settings')
            .select('*')
            .single();

        if (error) throw error;

        currentSettings = settings;

        // Update form fields
        document.getElementById('enableMonetization').checked = settings.enable_monetization;
        document.getElementById('enableAds').checked = settings.enable_ads;
        document.getElementById('enablePreRoll').checked = settings.enable_pre_roll;
        document.getElementById('enableMidRoll').checked = settings.enable_mid_roll;
        document.getElementById('enablePostRoll').checked = settings.enable_post_roll;
        document.getElementById('enableBanner').checked = settings.enable_banner;
        document.getElementById('preRollRate').value = settings.pre_roll_rate;
        document.getElementById('midRollRate').value = settings.mid_roll_rate;
        document.getElementById('postRollRate').value = settings.post_roll_rate;
        document.getElementById('bannerRate').value = settings.banner_rate;
    } catch (error) {
        console.error('Error loading monetization settings:', error);
        showError('Failed to load monetization settings');
    }
}

// Load subscription plans
async function loadSubscriptionPlans() {
    try {
        const { data: plans, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .order('price');

        if (error) throw error;

        subscriptionPlans.innerHTML = plans.map(plan => `
            <div class="card mb-3" data-plan-id="${plan.id}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="card-title mb-0">${plan.name}</h5>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="editPlan('${plan.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deletePlan('${plan.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <p class="mb-2">
                                <strong>Price:</strong> $${plan.price}/month
                            </p>
                            <p class="mb-2">
                                <strong>Status:</strong>
                                <span class="badge ${plan.is_active ? 'bg-success' : 'bg-danger'}">
                                    ${plan.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </p>
                        </div>
                        <div class="col-md-6">
                            <p class="mb-2"><strong>Features:</strong></p>
                            <ul class="list-unstyled">
                                ${plan.features.map(feature => `
                                    <li><i class="fas fa-check text-success me-2"></i>${feature}</li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading subscription plans:', error);
        showError('Failed to load subscription plans');
    }
}

// Load platform statistics
async function loadPlatformStatistics() {
    try {
        const { data: stats, error } = await supabase
            .from('platform_statistics')
            .select('*')
            .single();

        if (error) throw error;

        totalRevenue.textContent = `$${stats.total_revenue.toFixed(2)}`;
        activeSubscribers.textContent = stats.active_subscribers;
        adImpressions.textContent = stats.ad_impressions.toLocaleString();
        conversionRate.textContent = `${(stats.conversion_rate * 100).toFixed(1)}%`;
    } catch (error) {
        console.error('Error loading platform statistics:', error);
        showError('Failed to load platform statistics');
    }
}

// Load revenue data
async function loadRevenueData() {
    try {
        const { data: revenue, error } = await supabase
            .from('revenue_history')
            .select('*')
            .order('date', { ascending: true })
            .limit(30);

        if (error) throw error;

        revenueData = revenue;

        // Create chart
        const ctx = revenueChart.getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: revenue.map(r => new Date(r.date).toLocaleDateString()),
                datasets: [{
                    label: 'Daily Revenue',
                    data: revenue.map(r => r.amount),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
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
        console.error('Error loading revenue data:', error);
        showError('Failed to load revenue data');
    }
}

// Save monetization settings
async function saveMonetizationSettings() {
    try {
        const settings = {
            enable_monetization: document.getElementById('enableMonetization').checked,
            enable_ads: document.getElementById('enableAds').checked,
            enable_pre_roll: document.getElementById('enablePreRoll').checked,
            enable_mid_roll: document.getElementById('enableMidRoll').checked,
            enable_post_roll: document.getElementById('enablePostRoll').checked,
            enable_banner: document.getElementById('enableBanner').checked,
            pre_roll_rate: parseFloat(document.getElementById('preRollRate').value),
            mid_roll_rate: parseFloat(document.getElementById('midRollRate').value),
            post_roll_rate: parseFloat(document.getElementById('postRollRate').value),
            banner_rate: parseFloat(document.getElementById('bannerRate').value)
        };

        const { error } = await supabase
            .from('platform_settings')
            .update(settings)
            .eq('id', currentSettings.id);

        if (error) throw error;

        showSuccess('Settings saved successfully');
    } catch (error) {
        console.error('Error saving monetization settings:', error);
        showError('Failed to save settings');
    }
}

// Add new subscription plan
async function addNewPlan() {
    try {
        const { data: plan, error } = await supabase
            .from('subscription_plans')
            .insert([{
                name: 'New Plan',
                price: 0,
                features: ['Feature 1', 'Feature 2'],
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;

        await loadSubscriptionPlans();
        showSuccess('New plan added successfully');
    } catch (error) {
        console.error('Error adding new plan:', error);
        showError('Failed to add new plan');
    }
}

// Edit subscription plan
async function editPlan(planId) {
    try {
        const { data: plan, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (error) throw error;

        // Show edit modal
        const modal = new bootstrap.Modal(document.getElementById('editPlanModal'));
        document.getElementById('editPlanId').value = plan.id;
        document.getElementById('editPlanName').value = plan.name;
        document.getElementById('editPlanPrice').value = plan.price;
        document.getElementById('editPlanFeatures').value = plan.features.join('\n');
        document.getElementById('editPlanActive').checked = plan.is_active;
        modal.show();
    } catch (error) {
        console.error('Error loading plan details:', error);
        showError('Failed to load plan details');
    }
}

// Delete subscription plan
async function deletePlan(planId) {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
        const { error } = await supabase
            .from('subscription_plans')
            .delete()
            .eq('id', planId);

        if (error) throw error;

        await loadSubscriptionPlans();
        showSuccess('Plan deleted successfully');
    } catch (error) {
        console.error('Error deleting plan:', error);
        showError('Failed to delete plan');
    }
}

// Save plan changes
async function savePlanChanges() {
    try {
        const planId = document.getElementById('editPlanId').value;
        const name = document.getElementById('editPlanName').value;
        const price = parseFloat(document.getElementById('editPlanPrice').value);
        const features = document.getElementById('editPlanFeatures').value
            .split('\n')
            .map(f => f.trim())
            .filter(f => f.length > 0);
        const isActive = document.getElementById('editPlanActive').checked;

        const { error } = await supabase
            .from('subscription_plans')
            .update({
                name,
                price,
                features,
                is_active: isActive
            })
            .eq('id', planId);

        if (error) throw error;

        // Close modal and refresh plans
        const modal = bootstrap.Modal.getInstance(document.getElementById('editPlanModal'));
        modal.hide();
        await loadSubscriptionPlans();
        showSuccess('Plan updated successfully');
    } catch (error) {
        console.error('Error saving plan changes:', error);
        showError('Failed to save plan changes');
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
    // Save settings button
    document.querySelector('button[onclick="saveMonetizationSettings()"]')
        .addEventListener('click', saveMonetizationSettings);

    // Logout button
    document.getElementById('logoutBtn')
        .addEventListener('click', async () => {
            try {
                await supabase.auth.signOut();
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Error logging out:', error);
                showError('Failed to log out');
            }
        });
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdminPanel); 