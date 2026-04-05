# Workspace Chat

A full-stack workspace chat application: create workspaces, invite members, organize channels, and message in real time. The UI is built with **Vite**, **React**, **Tailwind CSS v4**, and **Motion**; the API uses **Node.js**, **Express**, **MongoDB**, **JWT** authentication, and **Socket.io** for live updates.

---

## Repository layout

```
Chatting-application/
├── backend/
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Channel.js
│   │   ├── Message.js
│   │   ├── User.js
│   │   └── Workspace.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── channel.js
│   │   ├── message.js
│   │   └── workspace.js
│   ├── server.js              # HTTP + Socket.io entry
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── components/
│       │   └── LoadingScreen.jsx
│       ├── pages/
│       │   ├── About.jsx      # In-app project story / docs
│       │   ├── ChatMessagesView.jsx
│       │   └── Team.jsx       # Placeholder for team credits
│       ├── utils/
│       │   └── chatTime.js    # Relative times, day dividers
│       ├── App.jsx
│       ├── Auth.jsx
│       ├── Chat.jsx           # Sidebar, socket state, modals, <Outlet />
│       ├── config.js          # VITE_API_URL → API base
│       ├── index.css          # Tailwind @import + @theme
│       ├── main.jsx
│       └── motionVariants.js
└── README.md
```

---

## Features (high level)

- Register, log in, JWT sessions
- Workspaces with invite IDs, channels, member list
- Real-time messages, typing indicators, online presence
- Delete own messages (with socket sync)
- Frontend routes: `/chat`, `/about`, `/team` (same visual theme)
- Client-side channel message search, relative timestamps, day separators, copy message, jump-to-latest when scrolled up, **Esc** closes modals

---

## Prerequisites

- **Node.js** (LTS recommended) and **npm**
- **MongoDB** connection string (e.g. MongoDB Atlas)
- For local full-stack dev: backend and frontend running together; optional `.env` files as below

---

## Backend: environment variables

Create `backend/.env` locally (this file must **never** be committed; it is listed in `.gitignore`).

| Variable     | What to put                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MONGO_URI`  | In **MongoDB Atlas**: cluster → **Connect** → **Drivers**, copy the connection string, then insert your database user’s password. Paste the full string as the value of `MONGO_URI`. |
| `JWT_SECRET` | A long random string for signing JWTs (e.g. from a password manager or `openssl rand -hex 32`).                                                                                      |

Example:

```env
MONGO_URI=
JWT_SECRET=
```

The server reads `MONGO_URI` (see `backend/server.js`). Use a strong `JWT_SECRET` in production.

**GitHub secret scanning:** Do not put real connection strings, passwords, or JWT secrets in `README.md`, issues, or commits. If a credential was pushed, **rotate** it in Atlas and replace `JWT_SECRET`.

---

## Backend: install and run

Open a terminal in the project root, then:

```bash
cd backend
npm install
npm start
```

The API and Socket.io server start via `node server.js`. The listening port is `process.env.PORT` or **10000** by default (see `backend/server.js`). Set `VITE_API_URL` to match, for example `http://localhost:10000`.

Optional (if you add a dev script with nodemon):

```bash
cd backend
npx nodemon server.js
```

---

## Frontend: environment variables

Create `frontend/.env` (optional; defaults to the deployed Render URL in `src/config.js`):

```env
VITE_API_URL=https://your-api.example.com
```

No trailing slash. Restart the Vite dev server after changing this file.

---

## Frontend: install, develop, build, preview

```bash
cd frontend
npm install
npm run dev
```

Development server (Vite) prints a local URL (typically `http://localhost:5173`).

Production build:

```bash
cd frontend
npm run build
```

Preview the production build locally:

```bash
cd frontend
npm run preview
```

---

## End-to-end local workflow (summary)

1. Configure `backend/.env` with `MONGO_URI` and `JWT_SECRET`.
2. Start backend: `cd backend && npm install && npm start`.
3. Configure `frontend/.env` with `VITE_API_URL` pointing at your backend (including port).
4. Start frontend: `cd frontend && npm install && npm run dev`.
5. Open the Vite URL in the browser, register or log in, then use workspaces and channels.

---

## Deployment notes

- **Backend**: Deploy to Render (or similar); set `MONGO_URI` and `JWT_SECRET` in the host environment.
- **Frontend**: Deploy the static `frontend/dist` output after `npm run build`; set `VITE_API_URL` at build time to your deployed API origin so the client and Socket.io target the correct server.

---

## Contributors

| Name            | Email                        | Role                       |
| --------------- | ---------------------------- | -------------------------- |
| Shivam Nauriyal | shivamnauriyal1224@gmail.com | System design and frontend |
| Krish Gupta     | krishgupta.udh@gmail.com     | System design and backend  |
