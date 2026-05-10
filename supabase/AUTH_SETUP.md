# Supabase Auth Setup — Password Reset

## Required Supabase Dashboard Settings

Go to: **Supabase Dashboard → Authentication → URL Configuration**

### Site URL
```
http://localhost:3000
```
(Change to your production URL when deploying, e.g. https://app.ror.sa)

### Redirect URLs (Allowed)
Add these exactly:
```
http://localhost:3000/auth/callback
https://app.ror.sa/auth/callback
```

Without these, Supabase will block the redirect and the reset link won't work.

---

## How the Flow Works

1. User visits `/forgot-password` and enters their email
2. Supabase sends an email with a link to:
   `https://yourapp.com/auth/callback?code=xxx&next=/reset-password`
3. `/auth/callback` exchanges the one-time `code` for a real session (sets cookies)
4. User is redirected to `/reset-password`
5. User sets new password → `supabase.auth.updateUser({ password })`
6. Session is signed out, user is sent to `/login`

---

## Email Template (Optional Customization)

Go to: **Supabase Dashboard → Authentication → Email Templates → Reset Password**

You can customize the email. The `{{ .ConfirmationURL }}` variable already points
to your configured redirect URL automatically.
