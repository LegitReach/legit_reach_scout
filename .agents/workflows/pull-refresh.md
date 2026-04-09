---
description: Pull from Git and Update Research Notes
---
// turbo-all
1. Pull the latest changes from the repository.
   ```powershell
   git pull
   ```
2. Re-analyze the codebase and update the `research_notes.md` artifact.
   - List root and key directories (`src/`, `src/app/`, `src/lib/`, `supabase/`).
   - Check `package.json` for new dependencies.
   - Update `research_notes.md` with any new features, architectural changes, or logic.

3. Verify the core application still builds.
   ```powershell
   npm run build
   ```
