# Unfold

A guided movement app with selectable routines, fixed move timings, illustrated instructions, a timer, chimes, and local practice history. Installable on iPhone through Safari → Share → Add to Home Screen.

## GitHub Pages

Publish `main` → `/docs` in repository Settings → Pages → Build and deployment → Deploy from a branch. `.nojekyll` lets GitHub serve the static app directly. Subsequent commits to `docs/` update the website automatically.

The app uses relative installation paths and scope-isolated offline caches, so it supports both a project URL such as `https://USERNAME.github.io/unfold/` and a custom domain.

Open the deployed URL in Safari, add it to your Home Screen, and open it while online once to cache the app. The installed app needs no weekly signing renewal. Offline use depends on browser caches remaining on the device.

## Develop

Requires Python 3 for local live preview and Node 18+ for the checks. No npm dependencies.

```sh
npm test
npm run dev
```

Open http://localhost:4173. Save changes under `docs/` to refresh the same browser tab. Local preview bypasses offline caching. A refresh discards unfinished practice.

## Data

History/preferences stay in localStorage on the current browser origin. The GitHub Pages app starts with fresh history; it does not automatically receive records from the previous host or localhost. Removing the app, clearing browser data, or storage cleanup can remove history. No analytics or server-side user database is included.

## Routines and artwork

The first routine adapts the fixed order/timings from [Dani Winks’ front-splits routine](https://www.daniwinksflexibility.com/bendy-blog/10-minute-front-splits-routine), with original demonstrations linked in the app. Attribution does not imply endorsement. Images were supplied for this project. No license to reuse this repository’s artwork is granted by this README.

Add reviewed definitions to `docs/routines.js`. All durations are explicit per move; preparation time is separate.
