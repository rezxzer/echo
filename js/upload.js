// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const videoFileInput = document.getElementById('videoFile');
const thumbnailFileInput = document.getElementById('thumbnailFile');
const videoPreview = document.getElementById('videoPreview');
const thumbnailPreview = document.getElementById('thumbnailPreview');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = uploadProgress.querySelector('.progress-bar');
const uploadButton = document.getElementById('uploadButton');
const categorySelect = document.getElementById('category');
const tagsSelect = document.getElementById('tags');

// Video processing options
const processingOptions = {
    format: 'mp4',
    quality: 'high',
    resolution: '720p',
    thumbnail: true
};

// File size limits (in bytes)
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5MB

// Supported file types
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Initialize Select2 for tags
$(document).ready(function() {
    $('#tags').select2({
        tags: true,
        tokenSeparators: [',', ' '],
        maximumSelectionLength: 5,
        placeholder: 'Add up to 5 tags',
        allowClear: true
    });
});

// Load categories
async function loadCategories() {
    try {
        const categories = window.categoryManager.getCategories();
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.innerHTML = `<i class="fas ${category.icon}"></i> ${category.name}`;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Failed to load categories. Please try again.');
    }
}

// Handle video file selection
videoFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
        showError('Video file size must be less than 500MB');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
        showError('Please select a valid video file');
        return;
    }

    // Show preview
    const video = videoPreview.querySelector('video');
    video.src = URL.createObjectURL(file);
    videoPreview.classList.remove('d-none');

    // Get video metadata
    try {
        const metadata = await window.videoProcessingService.getVideoMetadata(file);
        console.log('Video metadata:', metadata);
    } catch (error) {
        console.error('Error getting video metadata:', error);
    }
});

// Handle thumbnail file selection
thumbnailFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('Thumbnail file size must be less than 5MB');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
    }

    // Show preview
    const img = thumbnailPreview.querySelector('img');
    img.src = URL.createObjectURL(file);
    thumbnailPreview.classList.remove('d-none');
});

// Handle form submission
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const videoFile = videoFileInput.files[0];
    const thumbnailFile = thumbnailFileInput.files[0];
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const category = categorySelect.value;
    const tags = $('#tags').val() || [];
    const visibility = document.querySelector('input[name="visibility"]:checked').value;

    if (!videoFile) {
        showError('Please select a video file');
        return;
    }

    if (!category) {
        showError('Please select a category');
        return;
    }

    try {
        // Disable upload button and show progress
        uploadButton.disabled = true;
        uploadProgress.classList.remove('d-none');
        progressBar.style.width = '0%';

        // Process video
        const processedVideo = await window.videoProcessingService.processVideo(videoFile, processingOptions);
        
        // Update progress
        updateProgress(30);

        // Upload to Supabase
        const { data, error } = await supabase.uploadVideo(
            processedVideo.video,
            thumbnailFile || processedVideo.thumbnail,
            {
                title,
                description,
                category_id: category,
                visibility,
                duration: processedVideo.metadata.duration,
                resolution: processedVideo.resolution
            }
        );

        if (error) throw error;

        // Update progress
        updateProgress(60);

        // Add tags if any
        if (tags.length > 0) {
            await window.categoryManager.addTagsToVideo(data.id, tags);
        }

        // Update progress
        updateProgress(100);

        // Show success message
        showSuccess('Video uploaded successfully!');
        
        // Redirect to video page
        setTimeout(() => {
            window.location.href = `/video.html?id=${data.id}`;
        }, 2000);

    } catch (error) {
        console.error('Error uploading video:', error);
        showError('Failed to upload video. Please try again.');
    } finally {
        uploadButton.disabled = false;
    }
});

// Update progress bar
function updateProgress(percent) {
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', percent);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show success message
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    uploadForm.insertBefore(alert, uploadForm.firstChild);
}

// Show error message
function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    uploadForm.insertBefore(alert, uploadForm.firstChild);
}

// Check authentication and load categories on page load
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = '/login.html';
    } else {
        await loadCategories();
    }
}); 