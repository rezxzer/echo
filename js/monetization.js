// Video Monetization Service
class MonetizationService {
    constructor() {
        this.subscriptionPlans = [
            {
                id: 'basic',
                name: 'Basic Plan',
                price: 4.99,
                features: [
                    'Ad-free viewing',
                    'HD quality',
                    'Basic analytics'
                ]
            },
            {
                id: 'premium',
                name: 'Premium Plan',
                price: 9.99,
                features: [
                    'Ad-free viewing',
                    '4K quality',
                    'Advanced analytics',
                    'Priority support',
                    'Early access to new features'
                ]
            }
        ];

        this.adTypes = ['pre-roll', 'mid-roll', 'post-roll', 'banner'];
        this.adRates = {
            'pre-roll': 0.01,  // $0.01 per view
            'mid-roll': 0.015, // $0.015 per view
            'post-roll': 0.01, // $0.01 per view
            'banner': 0.005    // $0.005 per view
        };
    }

    // Get all subscription plans
    getSubscriptionPlans() {
        return this.subscriptionPlans;
    }

    // Get user's subscription status
    async getUserSubscription() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting user subscription:', error);
            throw error;
        }
    }

    // Subscribe user to a plan
    async subscribeToPlan(planId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const plan = this.subscriptionPlans.find(p => p.id === planId);
            if (!plan) throw new Error('Invalid plan');

            const { error } = await supabase
                .from('subscriptions')
                .upsert({
                    user_id: user.id,
                    plan_id: planId,
                    status: 'active',
                    start_date: new Date().toISOString(),
                    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error subscribing to plan:', error);
            throw error;
        }
    }

    // Get video monetization settings
    async getVideoMonetization(videoId) {
        try {
            const { data, error } = await supabase
                .from('video_monetization')
                .select('*')
                .eq('video_id', videoId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting video monetization:', error);
            throw error;
        }
    }

    // Update video monetization settings
    async updateVideoMonetization(videoId, settings) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Verify video ownership
            const { data: video, error: videoError } = await supabase
                .from('videos')
                .select('user_id')
                .eq('id', videoId)
                .single();

            if (videoError) throw videoError;
            if (video.user_id !== user.id) throw new Error('Unauthorized');

            const { error } = await supabase
                .from('video_monetization')
                .upsert({
                    video_id: videoId,
                    enabled: settings.enabled,
                    ad_types: settings.ad_types,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error updating video monetization:', error);
            throw error;
        }
    }

    // Get video earnings
    async calculateEarnings(videoId) {
        try {
            const { data: views, error } = await supabase
                .from('ad_views')
                .select('*')
                .eq('video_id', videoId);

            if (error) throw error;

            const earnings = {
                total: 0,
                byType: {}
            };

            views.forEach(view => {
                const rate = this.adRates[view.ad_type] || 0;
                const amount = rate * view.views;
                
                earnings.total += amount;
                earnings.byType[view.ad_type] = (earnings.byType[view.ad_type] || 0) + amount;
            });

            return earnings;
        } catch (error) {
            console.error('Error calculating video earnings:', error);
            throw error;
        }
    }

    // Get user earnings
    async getUserEarnings() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: videos, error: videosError } = await supabase
                .from('videos')
                .select('id')
                .eq('user_id', user.id);

            if (videosError) throw videosError;

            const videoIds = videos.map(v => v.id);
            const { data: views, error: viewsError } = await supabase
                .from('ad_views')
                .select('*')
                .in('video_id', videoIds);

            if (viewsError) throw viewsError;

            const earnings = views.map(view => ({
                date: view.date,
                amount: this.adRates[view.ad_type] * view.views
            }));

            return earnings;
        } catch (error) {
            console.error('Error getting user earnings:', error);
            throw error;
        }
    }

    // Process ad view
    async processAdView(videoId, adType) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Check if user has active subscription
            const subscription = await this.getUserSubscription();
            if (subscription?.status === 'active') {
                return; // Skip ad for subscribed users
            }

            // Verify video monetization is enabled
            const monetization = await this.getVideoMonetization(videoId);
            if (!monetization?.enabled || !monetization.ad_types.includes(adType)) {
                return;
            }

            // Record ad view
            const { error } = await supabase
                .from('ad_views')
                .upsert({
                    video_id: videoId,
                    ad_type: adType,
                    date: new Date().toISOString().split('T')[0],
                    views: 1
                }, {
                    onConflict: 'video_id,ad_type,date'
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error processing ad view:', error);
            throw error;
        }
    }
}

// Initialize monetization service
window.monetizationService = new MonetizationService(); 