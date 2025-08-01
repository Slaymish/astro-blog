import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../supabase/types'

const supabaseUrl = process.env.SUPABASE_DATABASE_URL;

const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey ? createClient<Database>(supabaseUrl, supabaseKey) : null;
