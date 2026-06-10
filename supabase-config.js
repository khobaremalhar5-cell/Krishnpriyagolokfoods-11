// Supabase Configuration
// Replace these with your actual Supabase credentials from https://app.supabase.com

const SUPABASE_CONFIG = {
  URL: "https://YOUR_PROJECT_ID.supabase.co", // Replace with your Supabase URL
  ANON_KEY: "YOUR_ANON_KEY_HERE", // Replace with your anon public key
  ADMIN_PASSWORD: "admin@2024" // Change this to your secure password
};

// Initialize Supabase Client
const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

// Make it globally available
window.supabaseClient = supabaseClient;
window.ADMIN_PASSWORD = SUPABASE_CONFIG.ADMIN_PASSWORD;
