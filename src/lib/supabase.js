import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://afqrcrjmbuopzzxecifi.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_05LIKxeW85N6mS1936VVwA_hIlZZPxb'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

