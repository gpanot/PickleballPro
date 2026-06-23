# Edge Function Deployment Guide

## Password Reset Edge Function

This guide explains how to deploy the `reset-user-password` Edge Function to Supabase.

## Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref lenlkoqtczffweamgsxv
```

## Deploy the Function

1. Navigate to your project root directory

2. Deploy the function:
```bash
supabase functions deploy reset-user-password
```

3. Set the required environment variables:
```bash
supabase secrets set SUPABASE_URL=https://lenlkoqtczffweamgsxv.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important:** Get your service role key from:
- Supabase Dashboard → Project Settings → API → Service Role Key (secret)

## Verify Deployment

After deployment, the function will be available at:
```
https://lenlkoqtczffweamgsxv.supabase.co/functions/v1/reset-user-password
```

## Testing

You can test the function using curl:

```bash
curl -X POST \
  'https://lenlkoqtczffweamgsxv.supabase.co/functions/v1/reset-user-password' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user-uuid-here",
    "newPassword": "NewPassword123!"
  }'
```

## Security Notes

- The Edge Function validates that the requesting user is an admin
- The service role key is stored securely as a Supabase secret
- Never expose the service role key in client-side code

