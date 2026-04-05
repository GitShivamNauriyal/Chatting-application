const raw =
    import.meta.env.VITE_API_URL ||
    "https://workspace-chat-backend.onrender.com"

export const API_BASE = String(raw).replace(/\/$/, "")
