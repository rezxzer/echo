// Video Processing Service
class VideoProcessingService {
    constructor() {
        this.worker = null;
        this.initializeWorker();
    }

    async initializeWorker() {
        // Load FFmpeg worker
        const ffmpeg = await import('@ffmpeg/ffmpeg');
        this.worker = new ffmpeg.FFmpeg();
        await this.worker.load();
    }

    async processVideo(videoFile, options = {}) {
        try {
            if (!this.worker) {
                throw new Error('FFmpeg worker not initialized');
            }

            // Set default options
            const defaultOptions = {
                format: 'mp4',
                quality: 'high',
                resolution: '720p',
                thumbnail: true
            };

            const processingOptions = { ...defaultOptions, ...options };

            // Write video file to memory
            await this.worker.writeFile('input', videoFile);

            // Process video based on options
            const commands = this.getFFmpegCommands(processingOptions);
            await this.worker.exec(commands);

            // Read processed video
            const processedVideo = await this.worker.readFile('output');

            // Generate thumbnail if requested
            let thumbnail = null;
            if (processingOptions.thumbnail) {
                thumbnail = await this.generateThumbnail(videoFile);
            }

            return {
                video: processedVideo,
                thumbnail,
                format: processingOptions.format,
                resolution: processingOptions.resolution
            };
        } catch (error) {
            console.error('Error processing video:', error);
            throw error;
        }
    }

    getFFmpegCommands(options) {
        const commands = [];

        // Set input
        commands.push('-i', 'input');

        // Set video codec and quality
        commands.push('-c:v', 'libx264');
        commands.push('-preset', options.quality === 'high' ? 'slow' : 'medium');
        commands.push('-crf', options.quality === 'high' ? '18' : '23');

        // Set resolution
        if (options.resolution === '1080p') {
            commands.push('-vf', 'scale=1920:1080');
        } else if (options.resolution === '720p') {
            commands.push('-vf', 'scale=1280:720');
        } else if (options.resolution === '480p') {
            commands.push('-vf', 'scale=854:480');
        }

        // Set audio codec
        commands.push('-c:a', 'aac');
        commands.push('-b:a', '128k');

        // Set output format
        commands.push('-f', options.format);

        // Set output file
        commands.push('output');

        return commands;
    }

    async generateThumbnail(videoFile) {
        try {
            // Write video file to memory
            await this.worker.writeFile('input', videoFile);

            // Generate thumbnail at 5 seconds
            await this.worker.exec([
                '-i', 'input',
                '-ss', '00:00:05',
                '-vframes', '1',
                '-vf', 'scale=320:180',
                'thumbnail.jpg'
            ]);

            // Read thumbnail
            const thumbnail = await this.worker.readFile('thumbnail.jpg');
            return thumbnail;
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            throw error;
        }
    }

    async getVideoMetadata(videoFile) {
        try {
            // Write video file to memory
            await this.worker.writeFile('input', videoFile);

            // Get video information
            await this.worker.exec([
                '-i', 'input',
                '-f', 'null',
                '-'
            ]);

            // Parse FFmpeg output to get metadata
            const output = await this.worker.readFile('output');
            const metadata = this.parseFFmpegOutput(output);

            return metadata;
        } catch (error) {
            console.error('Error getting video metadata:', error);
            throw error;
        }
    }

    parseFFmpegOutput(output) {
        // Parse FFmpeg output to extract metadata
        const metadata = {
            duration: 0,
            size: 0,
            bitrate: 0,
            resolution: '',
            fps: 0
        };

        // Parse duration
        const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
        if (durationMatch) {
            const [, hours, minutes, seconds] = durationMatch;
            metadata.duration = (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + parseInt(seconds);
        }

        // Parse resolution
        const resolutionMatch = output.match(/Stream.*Video.* (\d+)x(\d+)/);
        if (resolutionMatch) {
            const [, width, height] = resolutionMatch;
            metadata.resolution = `${width}x${height}`;
        }

        // Parse FPS
        const fpsMatch = output.match(/(\d+(?:\.\d+)?) fps/);
        if (fpsMatch) {
            metadata.fps = parseFloat(fpsMatch[1]);
        }

        return metadata;
    }
}

// Export the service
window.videoProcessingService = new VideoProcessingService(); 