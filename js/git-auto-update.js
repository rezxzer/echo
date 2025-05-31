// GitHub auto-update functionality
class GitAutoUpdater {
    constructor() {
        this.updateInterval = 300000; // Check every 5 minutes
        this.config = window.githubConfig;
        this.startAutoUpdate();
    }

    async startAutoUpdate() {
        setInterval(() => this.checkForUpdates(), this.updateInterval);
    }

    async checkForUpdates() {
        try {
            // Check if there are any changes
            const { stdout: status } = await this.runCommand('git status --porcelain');
            if (status) {
                // There are changes, commit and push them
                await this.runCommand('git add .');
                await this.runCommand('git commit -m "Auto-update: Changes from user interactions"');
                await this.runCommand('git push');
                
                // Create a new deployment
                await this.createDeployment();
                
                console.log('GitHub auto-update and deployment completed successfully');
            }
        } catch (error) {
            console.error('GitHub auto-update error:', error);
        }
    }

    async createDeployment() {
        try {
            const response = await fetch(`https://api.github.com/repos/${this.config.repoOwner}/${this.config.repoName}/deployments`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ref: 'main', // or your default branch
                    environment: 'production',
                    auto_merge: true,
                    required_contexts: [],
                    description: 'Automatic deployment from user interactions'
                })
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.statusText}`);
            }

            const deployment = await response.json();
            
            // Update deployment status
            await this.updateDeploymentStatus(deployment.id);
        } catch (error) {
            console.error('Deployment creation error:', error);
        }
    }

    async updateDeploymentStatus(deploymentId) {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.repoOwner}/${this.config.repoName}/deployments/${deploymentId}/statuses`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        state: 'success',
                        description: 'Deployment successful',
                        environment_url: this.config.siteUrl
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Deployment status update error:', error);
        }
    }

    async runCommand(command) {
        return new Promise((resolve, reject) => {
            const { exec } = require('child_process');
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }
}

// Initialize GitHub auto-updater when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.gitAutoUpdater = new GitAutoUpdater();
}); 