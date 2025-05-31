// Supabase configuration
const SUPABASE_URL = 'https://utruirfngebwhqkfcecz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlenh6ZXIiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMTg5NjAwMCwiZXhwIjoyMDI3NDcyMDAwfQ.YourKeyHere';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabaseClient; 