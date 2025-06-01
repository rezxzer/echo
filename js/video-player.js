class VideoPlayer {
    constructor(videoId) {
        this.videoId = videoId;
        this.videoElement = document.getElementById('videoPlayer');
        this.adContainer = document.getElementById('adContainer');
        this.currentAd = null;
        this.adQueue = [];
        this.isPlayingAd = false;
        this.midRollPositions = [0.25, 0.5, 0.75]; // 25%, 50%, 75% of video duration
        this.nextMidRollIndex = 0;
    }

    // Initialize video player
    async init() {
        try {
            // Get video data
            const { data: video, error } = await supabase
                .from('videos')
                .select('*')
                .eq('id', this.videoId)
                .single();

            if (error) throw error;

            // Set video source
            this.videoElement.src = video.video_url;
            this.videoElement.poster = video.thumbnail_url;

            // Get monetization settings
            const monetization = await window.monetizationService.getVideoMonetization(this.videoId);
            if (monetization?.enabled) {
                this.setupAdHandling(monetization.ad_types);
            }

            // Add event listeners
            this.addEventListeners();

            // Load video
            await this.videoElement.load();
        } catch (error) {
            console.error('Error initializing video player:', error);
            this.showError('Failed to load video');
        }
    }

    // Setup ad handling
    setupAdHandling(adTypes) {
        if (adTypes.includes('pre-roll')) {
            this.adQueue.push({ type: 'pre-roll' });
        }

        if (adTypes.includes('mid-roll')) {
            this.midRollPositions.forEach(position => {
                this.adQueue.push({ type: 'mid-roll', position });
            });
        }

        if (adTypes.includes('post-roll')) {
            this.adQueue.push({ type: 'post-roll' });
        }

        if (adTypes.includes('banner')) {
            this.showBannerAd();
        }
    }

    // Add event listeners
    addEventListeners() {
        // Play event
        this.videoElement.addEventListener('play', () => {
            if (!this.isPlayingAd) {
                this.processAdQueue();
            }
        });

        // Timeupdate event for mid-roll ads
        this.videoElement.addEventListener('timeupdate', () => {
            if (!this.isPlayingAd && this.nextMidRollIndex < this.midRollPositions.length) {
                const currentPosition = this.videoElement.currentTime / this.videoElement.duration;
                const nextMidRollPosition = this.midRollPositions[this.nextMidRollIndex];

                if (currentPosition >= nextMidRollPosition) {
                    this.showMidRollAd();
                    this.nextMidRollIndex++;
                }
            }
        });

        // Ended event for post-roll ads
        this.videoElement.addEventListener('ended', () => {
            if (!this.isPlayingAd) {
                this.showPostRollAd();
            }
        });

        // Error event
        this.videoElement.addEventListener('error', () => {
            this.showError('Error playing video');
        });
    }

    // Process ad queue
    async processAdQueue() {
        if (this.adQueue.length === 0 || this.isPlayingAd) return;

        const ad = this.adQueue.shift();
        if (ad.type === 'pre-roll') {
            await this.showPreRollAd();
        }
    }

    // Show pre-roll ad
    async showPreRollAd() {
        try {
            this.isPlayingAd = true;
            this.videoElement.pause();

            // Record ad view
            await window.monetizationService.processAdView(this.videoId, 'pre-roll');

            // Show ad (implement your ad display logic here)
            this.showAdPlaceholder('Pre-roll Ad');

            // Simulate ad duration (replace with actual ad)
            setTimeout(() => {
                this.hideAd();
                this.videoElement.play();
            }, 5000);
        } catch (error) {
            console.error('Error showing pre-roll ad:', error);
            this.hideAd();
            this.videoElement.play();
        }
    }

    // Show mid-roll ad
    async showMidRollAd() {
        try {
            this.isPlayingAd = true;
            const currentTime = this.videoElement.currentTime;
            this.videoElement.pause();

            // Record ad view
            await window.monetizationService.processAdView(this.videoId, 'mid-roll');

            // Show ad (implement your ad display logic here)
            this.showAdPlaceholder('Mid-roll Ad');

            // Simulate ad duration (replace with actual ad)
            setTimeout(() => {
                this.hideAd();
                this.videoElement.currentTime = currentTime;
                this.videoElement.play();
            }, 5000);
        } catch (error) {
            console.error('Error showing mid-roll ad:', error);
            this.hideAd();
            this.videoElement.play();
        }
    }

    // Show post-roll ad
    async showPostRollAd() {
        try {
            this.isPlayingAd = true;

            // Record ad view
            await window.monetizationService.processAdView(this.videoId, 'post-roll');

            // Show ad (implement your ad display logic here)
            this.showAdPlaceholder('Post-roll Ad');

            // Simulate ad duration (replace with actual ad)
            setTimeout(() => {
                this.hideAd();
                this.isPlayingAd = false;
            }, 5000);
        } catch (error) {
            console.error('Error showing post-roll ad:', error);
            this.hideAd();
        }
    }

    // Show banner ad
    async showBannerAd() {
        try {
            // Record ad view
            await window.monetizationService.processAdView(this.videoId, 'banner');

            // Show banner ad (implement your ad display logic here)
            this.adContainer.innerHTML = `
                <div class="banner-ad">
                    <div class="ad-content">
                        <h4>Banner Ad</h4>
                        <p>This is a placeholder for a banner ad.</p>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error showing banner ad:', error);
        }
    }

    // Show ad placeholder
    showAdPlaceholder(type) {
        this.adContainer.innerHTML = `
            <div class="ad-overlay">
                <div class="ad-content">
                    <h4>${type}</h4>
                    <p>This is a placeholder for an ad.</p>
                    <div class="ad-timer">5</div>
                </div>
            </div>
        `;

        // Start countdown
        let timeLeft = 5;
        const timerElement = this.adContainer.querySelector('.ad-timer');
        const timer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timer);
            }
        }, 1000);
    }

    // Hide ad
    hideAd() {
        this.adContainer.innerHTML = '';
        this.isPlayingAd = false;
    }

    // Show error message
    showError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'alert alert-danger alert-dismissible fade show';
        errorContainer.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        this.videoElement.parentElement.insertBefore(errorContainer, this.videoElement);
    }
}

// Initialize video player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const videoId = new URLSearchParams(window.location.search).get('id');
    if (videoId) {
        const player = new VideoPlayer(videoId);
        player.init();
    }
}); 