# Supabase Library Boundary

This folder is reserved for Supabase helpers that keep browser-safe and privileged paths separate.

- Public browser code may use only publishable configuration intended for the client.
- The Supabase service role key must remain server-only.
- Prediction locks, visibility rules, and score writes need backend enforcement where appropriate.

No Supabase client is created in this scaffold.
