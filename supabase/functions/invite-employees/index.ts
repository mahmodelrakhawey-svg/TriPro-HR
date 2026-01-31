// Add an empty export to satisfy the --isolatedModules flag.
export {}

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// These are required for browser based invocations
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('Hello from invite-employees Function!')

serve(async (req: Request) => {
  // This is needed if you're invoking the function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { emails } = await req.json()

    if (!emails || !Array.isArray(emails)) {
      throw new Error('"emails" is required and must be an array.')
    }

    // Create an admin client to invite users.
    // Note: These environment variables must be set in your Supabase project's dashboard.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const invitePromises = emails.map((email: string) =>
      supabaseAdmin.auth.admin.inviteUserByEmail(email)
    )

    const results = await Promise.allSettled(invitePromises)

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to invite ${emails[index]}:`, result.reason)
      }
    })

    return new Response(JSON.stringify({ message: `Successfully processed ${emails.length} invitations.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
