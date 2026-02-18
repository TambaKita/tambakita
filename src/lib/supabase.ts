import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vicrywuxofsfzgofvmgc.supabase.co'
const supabaseKey = 'sb_publishable_1NUQqJPmCM9kPfkuAwrgBg_L-agZRhi'

export const supabase = createClient(supabaseUrl, supabaseKey)
