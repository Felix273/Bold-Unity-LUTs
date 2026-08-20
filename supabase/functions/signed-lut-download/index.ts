import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Authentication required.' }, 401)

    const url = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json({ error: 'Authentication required.' }, 401)

    const { lutId } = await request.json()
    const admin = createClient(url, serviceKey)
    const { data: lut, error } = await admin.from('luts').select('id, title, price, file_url').eq('id', lutId).single()
    if (error || !lut?.file_url) return json({ error: 'LUT asset not found.' }, 404)

    const { data: profile } = await admin.from('user_profiles').select('plan, status').eq('user_id', user.id).maybeSingle()
    const isSubscriber = profile?.status === 'active' && ['pro', 'studio'].includes(String(profile.plan).toLowerCase())
    const { data: purchase } = await admin.from('user_purchases').select('id').eq('user_id', user.id).eq('lut_id', lut.id).eq('status', 'paid').maybeSingle()

    if (Number(lut.price) > 0 && !isSubscriber && !purchase) return json({ error: 'Purchase or active subscription required.' }, 403)

    const bucket = Deno.env.get('LUT_ASSET_BUCKET') || 'lut-assets'
    const { data: signed, error: signError } = await admin.storage.from(bucket).createSignedUrl(lut.file_url, 60)
    if (signError || !signed?.signedUrl) return json({ error: signError?.message || 'Unable to create download URL.' }, 502)

    await admin.from('user_downloads').insert({ user_id: user.id, lut_id: lut.id, title: lut.title })
    return json({ signedUrl: signed.signedUrl })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Download failed.' }, 500)
  }
})
