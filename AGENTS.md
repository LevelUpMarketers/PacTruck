# Git workflow

- At the beginning of each new coding session, create one new branch from the latest `main` before making changes. Use the existing checkout; each cloud task is already isolated, so do not create a Git worktree unless the user requests one.
- Keep all changes requested during that session on that same branch. Follow-up messages, context compaction, and environment reconnection do not start a new session or require another branch.
- Commit and push completed changes to the session branch. Do not commit or push changes directly to `main` unless the user explicitly requests an exception.
- Open a pull request targeting `main` as soon as the session branch has its first pushed change. GitHub cannot open a pull request for an empty branch with no differences.
- Keep that pull request updated as further changes are committed to the session branch. Reuse the existing pull request rather than opening duplicates.
- Leave merging to the user unless they explicitly request it.
- If access prevents pushing or creating the pull request, complete the independent work and report the specific blocker. Do not describe a pull request as created unless it exists.

# Runtime testing

The user tests this WordPress plugin on their laptop using Local by Flywheel. The local repository lives directly in the site's plugins folder. Cloud work is for editing and PHP syntax checks; do not prepare WordPress or a database in the cloud unless requested.
