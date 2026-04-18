# Waleed Imran — portfolio & booking site

Personal booking site with a Supabase-backed form and private admin dashboard for reviewing project briefs.

## Files
- `index.html` — public landing page (services, skill dashboard, work, book form)
- `admin.html` — private dashboard showing all incoming project briefs (password-gated)

## Stack
- Static HTML + vanilla JS (ES modules)
- Supabase (`bniudmwlpaqqpthsgppv`) for bookings storage
- Hosted on GitHub Pages

## Admin access
The admin dashboard lives at `/admin.html`. Password is required to read bookings (verified server-side via Supabase RPC).

To change the admin password:
1. Update the SQL function in Supabase:
   ```sql
   CREATE OR REPLACE FUNCTION public.get_portfolio_bookings(admin_pass text) ...
   IF admin_pass <> 'your-new-password' THEN RAISE EXCEPTION 'unauthorized' ...
   ```
   Same for `update_portfolio_booking` and `delete_portfolio_booking`.
2. That's it — no client-side changes needed.

## Database schema
Table: `public.portfolio_bookings`
- `id`, `created_at`, `name`, `email`, `service`, `budget`, `brief`, `source`, `status`, `notes`

RLS: public can INSERT, reads go through password-gated RPCs.

## Local dev
Just open `index.html` in a browser. No build step.
