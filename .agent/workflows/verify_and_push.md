---
description: Seed data, verify UI, and push changes
---

1. Run the seeding script to prepare for UI test
   - `python backend/seed_ui_conflict.py`

2. (Agent Action) Use browser tool to verify UI results if changes were made to the frontend.

3. Push changes
   - `git add .`
   - `git commit -m "verified: smart resolution ui check passed"`
   - `git push`
