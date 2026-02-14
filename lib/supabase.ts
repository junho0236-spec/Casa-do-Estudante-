
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://otjpcxifknoigggibooh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JOXB6jpJGtnABjCB7bhWMQ_2R_0tSiC';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
