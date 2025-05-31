// Auto update function for Git and Supabase
async function autoUpdate(message) {
    try {
        // Git commands
        await runCommand('git add .');
        await runCommand(`git commit -m "${message}"`);
        await runCommand('git push');
        
        // Supabase update check
        await checkSupabaseUpdates();
        
        console.log('Updates completed successfully!');
    } catch (error) {
        console.error('Error during auto update:', error);
    }
}

// Helper function to run terminal commands
async function runCommand(command) {
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

// Check for Supabase updates
async function checkSupabaseUpdates() {
    try {
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .limit(1);
            
        if (error) throw error;
        
        console.log('Supabase connection verified');
    } catch (error) {
        console.error('Supabase update check failed:', error);
    }
}

// Export the function
window.autoUpdate = autoUpdate; 