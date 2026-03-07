import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a stub client if env vars are missing (e.g. on GitHub Pages)
// The create page won't work without a real Supabase instance, but the
// rest of the site will function fine with static data.
export const supabase = (supabaseUrl && supabaseKey)
	? createClient(supabaseUrl, supabaseKey)
	: null
