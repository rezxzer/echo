// Supabase configuration
const SUPABASE_URL = 'https://utruirfngebwhqkfcecz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cnVpcmZuZ2Vid2hxa2ZjZWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MzczMTksImV4cCI6MjA2NDIxMzMxOX0.-TgUO3MqazUL6M5G5pJWpgfdL1ycx8VBPfWkYSm86bQ';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabaseClient; 