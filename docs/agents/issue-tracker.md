# Issue tracker: GitHub

Issues for this repo live as GitHub issues in the `chunri-bu` repository.

## Conventions

- **Create an issue**: on GitHub, open `https://github.com/<owner>/<repo>/issues/new` and fill in the title/body. (The `gh` CLI is not installed in this environment; use the GitHub web UI or REST API.)
- **Read an issue**: open the issue page, or use the REST API: `GET /repos/<owner>/<repo>/issues/<number>`.
- **List issues**: GitHub Issues list page, or `GET /repos/<owner>/<repo>/issues?state=open`.
- **Comment / label / close**: use the issue page buttons, or the corresponding REST endpoints.
- Infer the repo from `git remote -v` — the remote URL identifies `<owner>/<repo>`.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

This is a static website repo; day-to-day requests (background images, member profiles, announcements) are handled through the site's admin panel, not issues/PRs.

## When a skill says "publish to the issue tracker"

Create a GitHub issue at `https://github.com/<owner>/<repo>/issues/new`.

## When a skill says "fetch the relevant ticket"

Open the issue page, or fetch via `GET /repos/<owner>/<repo>/issues/<number>`.