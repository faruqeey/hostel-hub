import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Admin client using the SERVICE ROLE key.
 *
 * ⚠️ NEVER import this in client components or expose it to the browser.
 * It bypasses Row-Level Security entirely, so it must only be used in
 * trusted server contexts (API routes, webhooks, server actions).
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}