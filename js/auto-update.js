// Auto-update functionality
class AutoUpdater {
    constructor() {
        this.lastUpdate = null;
        this.updateInterval = 5000; // Check for updates every 5 seconds
        this.startAutoUpdate();
    }

    async startAutoUpdate() {
        setInterval(() => this.checkForUpdates(), this.updateInterval);
    }

    async checkForUpdates() {
        try {
            // Check for profile updates
            const { user } = await window.auth.getCurrentUser();
            if (user) {
                const { data: profile } = await window.db.getProfile(user.id);
                if (profile && (!this.lastUpdate || profile.updated_at > this.lastUpdate)) {
                    this.lastUpdate = profile.updated_at;
                    this.updateUI(profile);
                }
            }

            // Check for video updates
            const { data: videos } = await window.db.getAllVideos();
            if (videos && videos.length > 0) {
                const latestVideo = videos[0];
                if (!this.lastUpdate || latestVideo.created_at > this.lastUpdate) {
                    this.lastUpdate = latestVideo.created_at;
                    this.updateVideos(videos);
                }
            }
        } catch (error) {
            console.error('Auto-update error:', error);
        }
    }

    updateUI(profile) {
        // Update profile information in the UI
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = profile.username;
        }

        // Update avatar if exists
        const avatarElement = document.getElementById('avatar-preview');
        if (avatarElement && profile.avatar_url) {
            avatarElement.src = profile.avatar_url;
        }
    }

    updateVideos(videos) {
        // Update carousel if it exists
        const carouselVideos = document.getElementById('carouselVideos');
        const carouselIndicators = document.getElementById('carouselIndicators');
        
        if (carouselVideos && carouselIndicators) {
            // Get current active slide
            const activeSlide = carouselVideos.querySelector('.carousel-item.active');
            const activeIndex = Array.from(carouselVideos.children).indexOf(activeSlide);
            
            // Update carousel content
            carouselVideos.innerHTML = videos.map((video, index) => `
                <div class="carousel-item ${index === activeIndex ? 'active' : ''}">
                    <div class="video-container">
                        <video class="d-block w-100" src="${video.video_url}" controls></video>
                        <div class="carousel-caption">
                            <h5>${video.title}</h5>
                            <p>${video.description || ''}</p>
                            <p class="uploader">Posted by ${video.profiles?.username || 'Unknown'}</p>
                        </div>
                    </div>
                </div>
            `).join('');

            carouselIndicators.innerHTML = videos.map((_, index) => `
                <button type="button" 
                        data-bs-target="#videoCarousel" 
                        data-bs-slide-to="${index}" 
                        ${index === activeIndex ? 'class="active" aria-current="true"' : ''}
                        aria-label="Slide ${index + 1}">
                </button>
            `).join('');
        }

        // Update videos grid
        const videosGrid = document.getElementById('videos-grid');
        if (videosGrid) {
            videosGrid.innerHTML = videos.map(video => `
                <div class="col-md-6 col-lg-4">
                    <div class="card">
                        <video class="card-img-top" src="${video.video_url}" controls></video>
                        <div class="card-body">
                            <h5 class="card-title">${video.title}</h5>
                            <p class="card-text">${video.description || ''}</p>
                            <p class="card-text">
                                <small class="text-muted">Posted by ${video.profiles?.username || 'Unknown'}</small>
                            </p>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Initialize auto-updater when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.autoUpdater = new AutoUpdater();
}); 