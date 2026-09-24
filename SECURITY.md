# Security notes

This is a static portfolio and three frontend demonstrations hosted on GitHub Pages.
There is no application backend, real sign-in, server database, payment processing,
or shared review service in this repository.

## Data and trust boundaries

- Everything committed to this public repository, including images and old commits,
  can be downloaded. Client-side code is visible even with a private source repository.
- Reviews and their photos are stored in the visitor's localStorage, not on GitHub.
  They are not encrypted or protected by a user account. Other scripts running on
  the same origin can access that storage. GitHub Pages project paths on the same
  `username.github.io` domain share an origin; a path is not an isolation boundary.
- The contact form prepares a Telegram URL only after submission. Its contents are
  then passed to Telegram and may remain in browser history. Do not enter secrets.
- The login/register screens are demos. Their credential inputs are disabled;
  users open the dashboard directly without creating an account.
- Google Fonts and some VANTA DRIVE photos are fetched from external providers.
  Providers receive ordinary network information such as the visitor's IP address.

## Code protections

- Every HTML entry point declares a Content Security Policy before resource loads.
  Scripts are restricted to the same origin; inline scripts, event handlers, eval,
  fetch/WebSocket requests, frames, embedded objects, base URL overrides and native
  form submissions are disallowed. All application scripts are external local files.
- Inline styles remain allowed for the existing designs. This does not allow
  inline JavaScript. Font/image sources are explicitly limited to required origins.
- `no-referrer` and `noopener noreferrer` reduce information leakage through links
  and prevent opened tabs from controlling the original page.
- Review text is rendered with textContent, with length and storage limits.
  Uploaded photos are decoded and re-encoded as bounded JPEG thumbnails.
  Restored photos must be bounded JPEG data URLs; SVG/HTML/remote URLs are rejected.
- `.gitignore` excludes common local credential files. This does not detect or
  remove previously committed secrets, and does not replace a secret scanner.

## Hosting and account settings

GitHub Pages reported `https_enforced: true` when checked on 2026-09-24.
Protect the GitHub account and its recovery email with a passkey or 2FA, review
collaborators, OAuth/GitHub Apps and access tokens, and keep recovery codes offline.
Use branch rules and secret scanning/push protection where available.
These account settings cannot be secured by frontend JavaScript.

The meta CSP cannot enforce `frame-ancestors`, HSTS, X-Frame-Options or
X-Content-Type-Options. These require hosting/HTTP headers, not additional meta tags.
No clickjacking protection or absolute prevention of compromise is claimed.
Changing repository permissions alone does not hide published files.

If an actual secret is published, revoke/rotate it first. Removing it from the
latest commit is insufficient because history or cached copies may remain.
Do not open a public issue containing a secret, private user data or an exploit payload.

## Verification limits

Local checks validate policy declarations, compatible local script references,
absence of inline script/event handlers, input boundaries, and HTML/JS/CSS structure.
DOM tests are not proof of CSP enforcement by a real browser and are not a
penetration test. After deployment, check the browser console, font/photo loading,
language switching, review upload, demo navigation and Telegram handoff.

References:
- https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/preventing-unauthorized-access
