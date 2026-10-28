# LatentShield project homepage

Project page for **LatentShield: Composable Latent Multi-Agent Systems with Decision-Boundary Monitoring**.

**Website:** https://baichengdanny.github.io/latentshield/

## Local preview

No build step or JavaScript dependencies are required. From this directory, run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173/ in a browser.

## Files and editing

- `index.html`: paper metadata, authors, affiliations, section content, and animated SVG workflow.
- `styles.css`: typography, colors, responsive layout, and animation states.
- `app.js`: resource URLs, animation timeline, results tables, topology explorer, and citation.
- `assets/`: manuscript figures, institution logos, bibliography, and self-hosted fonts.

Set the `paper`, `code`, and `huggingface` URLs in `projectLinks` at the top of `app.js` when the research resources are released. Empty links intentionally retain their buttons with a Coming soon message. The Code button is reserved for the research implementation; this repository hosts the website.

The animation supports pause, replay, scrubbing, and high/low risk scenarios. Low risk retains monitoring and normal context flow but suppresses intervention packets. Playback pauses off-screen and respects reduced-motion preferences.

## GitHub Pages

Pages publishes directly from the **main branch, repository root**. `.nojekyll` keeps the site as plain static files. Pushing changes to `main` automatically updates the website. Use relative paths for page assets so the `/latentshield/` project prefix works correctly.

## Asset credits

- Research figures, experimental values, authors, and correspondence details come from the supplied LatentShield manuscript.
- Maryland horizontal wordmark: https://meta-square.github.io/static/img/aff/umd.webp
- All Purpose wordmark: manuscript branding assets.
- Lato and Noto Sans fonts are self-hosted; their SIL Open Font Licenses are in `assets/fonts/`.

Institutional logos and research figures retain their respective owners’ rights.
