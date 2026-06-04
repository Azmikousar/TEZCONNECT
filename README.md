# ⚡ TezConnect — B2B Professional Network

A full-featured B2B professional networking platform built with React + Vite.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

The app opens at **http://localhost:5173**

### Build for Production

```bash
npm run build       # outputs to /dist
npm run preview     # preview the production build locally
```

---

## 📁 Project Structure

```
tezconnect/
├── public/
│   └── favicon.svg          # App favicon
├── src/
│   ├── App.jsx              # Full application (all components)
│   └── main.jsx             # React entry point
├── index.html               # Vite HTML template
├── vite.config.js           # Vite configuration
├── package.json             # Dependencies & scripts
├── .eslintrc.cjs            # ESLint config
└── .gitignore
```

---

## ✨ Features

### Auth
- ✅ Sign Up with validation + password strength meter
- ✅ Sign In with SHA-256 hashed passwords (via Web Crypto API)
- ✅ Persistent session via localStorage
- ✅ Secure sign-out with confirmation modal

### Profile
- ✅ Profile completeness tracker (13 checkpoints)
- ✅ 5-section editor: Personal · Business · Contact · Social · Professional
- ✅ Photo upload for avatar, cover, company logo, portfolio items
- ✅ Skills, services, achievements as tag inputs
- ✅ Portfolio items with images and links
- ✅ Certifications manager
- ✅ Rich profile view with tabbed layout

### Dashboard
- ✅ Welcome card with session status
- ✅ Stats (Connections, Leads, Events, Cities)
- ✅ 9-capability platform overview grid with hover effects

### Testimonials
- ✅ Video testimonial cards with YouTube thumbnail previews
- ✅ Add testimonial modal with star rating

### Navigation
- ✅ Collapsible sidebar with active states and badge indicators
- ✅ Sticky top bar
- ✅ Placeholder screens for Network, Leads, Events, Messages, Settings

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#06070d` |
| Card | `#0b0d17` |
| Orange (primary) | `#f97316` |
| Amber (accent) | `#fbbf24` |
| Text | `#eef0f8` |
| Font | Plus Jakarta Sans + Instrument Serif |

---

## 🔒 Security Notes

- Passwords are hashed client-side with **SHA-256** (Web Crypto API) before storage
- No plain-text passwords are ever written to localStorage
- All user inputs are sanitized (`clean()` strips `<>` and trims whitespace)
- Email validation uses RFC-compliant regex

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | DOM rendering |
| vite | ^5.4.0 | Build tool & dev server |
| @vitejs/plugin-react | ^4.3.1 | JSX transform |

**Zero runtime dependencies beyond React.** All styling is inline CSS-in-JS.

---

## 🛠 Extending the App

### Add a new page
1. Add a nav item to the `NAV` array in `App.jsx`
2. Add a `if (page === "yourpage")` branch in `AppShell.renderPage()`
3. Create your screen component

### Connect a backend
Replace the `ls` (localStorage) helpers at the top of `App.jsx` with API calls. The function signatures (`getUsers`, `saveSession`, `getProfile`, etc.) are the only integration points.

---

## 📄 License

MIT — built for TezConnect B2B Network.