# Edge Functions

Deploy from the repository root with the Supabase CLI:

```bash
supabase functions deploy paystack-checkout
supabase functions deploy paystack-webhook
supabase functions deploy signed-lut-download
```

Set these secrets in the Supabase project:

```bash
supabase secrets set PAYSTACK_SECRET_KEY=your_secret_key
supabase secrets set PAYSTACK_CURRENCY=KES
supabase secrets set SITE_URL=https://your-production-domain.example
supabase secrets set LUT_ASSET_BUCKET=lut-assets
```

Set the Paystack webhook URL to:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook
```

Then switch the frontend environment to:

```env
VITE_PAYMENT_MODE=live
VITE_USE_EDGE_DOWNLOADS=true
```

Never place `PAYSTACK_SECRET_KEY` or a Supabase service-role key in frontend environment files.

Before launch, run `supabase/verify-assets.sql` in the SQL editor and fix every
unmatched path before enabling paid downloads.