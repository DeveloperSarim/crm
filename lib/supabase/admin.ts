import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only admin client using the service role key.
 * Bypasses Row-Level Security entirely — only use in trusted server actions
 * after you've already verified the caller's identity with the regular client.
 *
 * ⚠️  Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    )
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
