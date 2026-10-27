# SortLens Static Production Release — v1.0.0

This package contains the fully compiled, self-contained static distribution of **SortLens**, an academic sorting and searching algorithm analyzer powered by a C99 algorithmic engine compiled to WebAssembly.

---

## 1. Directory Structure

```text
SortLens-static/
├── index.html                                    # Production HTML5 application entry point
├── wasm/
│   └── core.js                                   # C99 algorithmic engine (compiled via Emscripten)
└── assets/
    ├── index-Bg_Cwofg.css                        # Laboratory dark graphite design system stylesheet
    ├── index-CivxPR-1.js                         # Production React/TypeScript/Zustand application bundle
    └── __vite-browser-external-cjWwuEFt.js       # Externalized Node.js compatibility stubs
```

---

## 2. Deployment Instructions

### Prerequisites
* A web server capable of serving static assets over HTTP/HTTPS.
* Modern web browser with WebAssembly support (Chrome 80+, Edge 80+, Firefox 75+, Safari 14+).

> [!IMPORTANT]
> **HTTP/HTTPS Protocol Required:**  
> Modern browser security policies (CORS and Web Workers/WebAssembly restrictions) prohibit loading JavaScript modules and WebAssembly over the `file://` protocol. Do not attempt to run SortLens by double-clicking `index.html`. Always serve the folder through an HTTP server.

### Option A: Local Testing with Node.js
If Node.js is installed on your workstation:

```bash
# Using 'serve'
npx serve release/SortLens-static -p 4173

# Or using Vite preview from the project root
npm run preview
```
Then navigate to: `http://localhost:4173/`

### Option B: Local Testing with Python
If Python 3 is installed:

```bash
cd release/SortLens-static
python -m http.server 8080
```
Then open: `http://localhost:8080/`

### Option C: Production Web Server (Nginx / Apache)
Copy the contents of `SortLens-static/` directly into your web root (e.g., `/var/www/html/` or `/usr/share/nginx/html/`):

```nginx
server {
    listen 80;
    server_name sortlens.example.edu;
    root /var/www/html/sortlens;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Ensure correct MIME type for JavaScript
    location ~* \.js$ {
        types { application/javascript js; }
    }
}
```

### Option D: Cloud Static Hosting (GitHub Pages, Cloudflare Pages, Vercel, Netlify)
Upload the `SortLens-static/` directory as the publish directory.
* **Base path:** `/` (default). If hosting on a subpath (e.g. `username.github.io/sortlens/`), configure `base: '/sortlens/'` in `vite.config.ts` prior to running `npm run build`.
* **Build command on CI:** `npm run build`
* **Output directory:** `dist`

---

## 3. Academic Integrity & Operational Guarantees

* **Zero Backend Requirement:** The application runs 100% client-side inside the browser sandbox. No user data, array inputs, or telemetry ever leave the client.
* **Deterministic Computation:** All sorting, counting, duplicate detection, and search operations are executed by the compiled C99 core. The frontend Canvas only visualizes recorded trace events.
* **No Gamification:** Free of arbitrary points, leaderboards, streaks, or confetti.

---

## 4. Technical Support & Verification

To verify the integrity of the build artifacts or rerun the automated browser verification suite, refer to the project documentation:
* [`ACADEMIC_VIVA_GUIDE.md`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/release/ACADEMIC_VIVA_GUIDE.md) — Comprehensive technical reference and examiner questions.
* [`VIVA_DEMONSTRATION_RUNBOOK.md`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/release/VIVA_DEMONSTRATION_RUNBOOK.md) — Step-by-step live demonstration script.
* [`RELEASE_MANIFEST.md`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/release/RELEASE_MANIFEST.md) — Build SHA-256 hashes, test metrics, and environmental parameters.
