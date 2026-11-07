# PixelTools

**PixelTools** is a free, privacy-first online image toolkit — a complete, multi-page static website built for [Google AdSense](https://www.google.com/adsense/) approval. Every image is processed **100% client-side** in the browser with the Canvas API. No image is ever uploaded, stored, or shared.

- **Static site** — HTML5, CSS3, vanilla JavaScript only. Zero build step. GitHub Pages compatible.
- **5 dedicated tool pages** — Image Compressor, Image Resizer, JPG to PNG, WebP Converter, Image Cropper.
- **Shared features** — drag-and-drop + click-to-upload + clipboard paste, batch upload with ZIP download (JSZip), clear progress/error messages, mobile-first responsive layout.
- **Trust pages** — About, Contact (Formspree placeholder + visible email), Privacy Policy, Cookie Policy, Terms of Service, Disclaimer, 404, plus an 8-article original blog.
- **AdSense ready** — cookie-consent banner (accept/reject/manage) blocks ad slots until consent, ad slots are reserved but fully commented out and inactive, no ads on legal pages or 404, `ads.txt` and `robots.txt` placeholders included.

## Project structure

```
.
├── assets/
│   ├── css/
│   │   └── pixeltools.css        # shared stylesheet (light/dark mode, variables)
│   ├── js/
│   │   ├── shared.js             # header nav, theme toggle, toasts, scroll-to-top
│   │   ├── cookies.js            # consent banner; blocks ad slots until consent
│   │   └── tools/
│   │       ├── compressor.js
│   │       ├── converter.js
│   │       ├── cropper.js        # uses cropperjs (cdnjs)
│   │       ├── resizer.js
│   │       └── webp-converter.js
│   ├── img/
│   │   └── favicon.svg
│   └── html/
│       └── partials/
│           └── header.html       # optional shared header include
├── blog/                         # 8 original articles (800+ words each)
├── tools/                        # 5 tool pages
├── index.html
├── about.html, contact.html, 404.html
├── privacy-policy.html, cookie-policy.html, terms-of-service.html, disclaimer.html
├── manifest.json, sitemap.xml, robots.txt, ads.txt, .nojekyll
```

## AdSense setup

1. **Replace the placeholder publisher ID** on every page. Open each HTML file and replace
   `ca-pub-XXXXXXXXXXXXXXXX` (and the matching `data-ad-slot`) with your actual Ad Manager/publisher ID.
   The ad slots are in `.ad-slot` containers and are currently **inactive/commented out**.
2. **Enable consent blocking.** `assets/js/cookies.js` blocks ad slots until the user accepts,
   and stores the preference in `localStorage`. Re-check the script after any Google consent-framework change.
3. **Optional** — replace the AdSense `<ins>`/`adsbygoogle` markup inside `.ad-slot` divs once approved.

> No ad scripts run on the legal pages (Privacy, Cookie, Terms, Disclaimer), the blog listing, or the 404 page, so those pages stay clean for crawler review.

## Analytics & privacy

- Cookie consent banner: `Accept` / `Reject` / `Manage`.
- Rejected `nocookielaw` cookies (analytics, consent, etc.) are blocked per the cookie policy.
- All image processing uses `Canvas.toDataURL`/`getBlob` + `JSZip` in memory. Nothing leaves the browser.

## Deployment — GitHub Pages

1. Push the repository to `https://github.com/kerryjoy12/Image-tools-website.git` (see below).
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set **Branch** to `main` and the **Folder** to `/root`.
4. Save. GitHub serves the site at `https://kerryjoy12.github.io/Image-tools-website/`
   (or your custom domain once you add a `CNAME` file).
5. Add a `CNAME` file at the repo root with your custom domain if you're using one.

### Local test server

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Adding a custom domain

1. Add a `CNAME` file at the repo root: e.g. `kerryjoy12.github.io`.
2. In **Settings → Pages**, under **Custom domain**, enter `pixeltools.example.com`.
3. Configure the DNS A records for your domain (GitHub provides the target IPs).

## Notes

- The repository currently uses `kerryjoy12/image-tools-website` as a placeholder domain.
  Replace `kerryjoy12/image-tools-website` in `<link rel="canonical">`, Open Graph, and
  `og:image` meta tags with your real domain before going live.
- The favicon and manifest are inline SVG, so no external image host is required.
- `assets/html/partials/header.html` contains the shared header. The pages include it
  inline for GitHub Pages compatibility (no server-side includes). To use the partial,
  include it at the top of each page's `<body>` or use a build step later.
