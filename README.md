# ClassHub — IEEE Team Project

A collaborative study platform for university students built with React, Vite, and Firebase. Students can join class-specific chat rooms, ask and answer Q&A questions, share resources, and organize peer study sessions.

---

## Features

- **Class Chat** — Real-time messaging scoped per class. Messages are isolated so each class has its own feed.
- **Q&A** — Post questions, vote up/down, and reply. Questions and replies are stored per class.
- **Resources** — Upload and download course files shared within a class.
- **Study Sessions** — Create and join peer study sessions with date, time, location, and topic tags. Includes in-session chat.
- **Course Discovery** — Browse and add classes to your sidebar.
- **My Classes** — Sidebar shows your enrolled classes. Clicking a class navigates directly to its chat.
- **Authentication** — Email/password sign-in and sign-up via Firebase Auth.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend / DB | Firebase Firestore (real-time) |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Routing | React Router v7 |
| Local dev | Firebase Emulator Suite |

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)

### Install dependencies

```bash
npm install
```

### Run with Firebase Emulators (recommended for local dev)

Start the emulator suite first, then start Vite in a separate terminal:

```bash
# Terminal 1 — Firebase emulators
npm run emulators

# Terminal 2 — Vite dev server
npm run dev
```

The app will be available at `http://localhost:5173`.  
The Firebase Emulator UI is at `http://localhost:4000`.

> **Note:** The app auto-connects to emulators when running on localhost. No real Firebase project credentials are needed for local development.

### Build for production

```bash
npm run build
```

---

## Project Structure

```
src/
├── context/
│   ├── AuthContext.jsx          # Firebase Auth state
│   └── ClassesContext.jsx       # My Classes state (active class, add/remove)
├── pages/
│   ├── Login.jsx
│   ├── SignIn.jsx
│   └── SignUp.jsx
├── components/
│   ├── header.jsx
│   ├── sidebar.jsx              # Navigation + My Classes list
│   └── rightsidebar.jsx
├── services/
│   └── firestore.js             # All Firestore helpers (chat, Q&A, resources)
├── App.jsx                      # Router + layout
├── DashboardOverview.jsx        # Home dashboard
├── chat.jsx                     # Class chat page
├── QAPage.jsx                   # Q&A page
├── ResourcesPage.jsx            # File sharing page
├── StudySessionsPage.jsx        # Study sessions list
├── SessionChat.jsx              # In-session chat
├── CreateSessionModal.jsx       # New session form
├── CourseDiscovery.jsx          # Browse & add classes
└── firebase.js                  # Firebase init
```

---

## Firestore Data Model

All user-generated content is scoped under a class ID:

```
classes/{classId}/
  chat/{msgId}
    replies/{replyId}
  qa/{questionId}
    replies/{replyId}

resources/{resId}
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run emulators` | Start Firebase emulators (Firestore, Auth, Storage) |
| `npm run lint` | Run ESLint |

---

## Contributing

1. Create a feature branch off `main`
2. Make your changes and test locally with emulators
3. Open a pull request — the team reviews before merging to `main`
