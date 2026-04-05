import { motion } from "motion/react"
import { fadeContainer, fadeItem } from "../motionVariants"

const sections = [
    {
        title: "What is this thing?",
        body: "Workspace Chat is a real-time team communication layer: workspaces, channels, live presence, typing indicators, and messages that sync through REST and WebSockets. Think of it as a focused slice of Discord or Telegram—built for learning, demos, and small groups—without the noise of a full social platform.",
    },
    {
        title: "The stack (and why it matters)",
        body: "The frontend is Vite + React, styled with Tailwind CSS v4 and animated with Motion. The API is Express on Node, MongoDB for persistence, JWT for sessions, and Socket.io for the “alive” feeling: typing, online lists, and instant message delivery. Each piece has a job; together they mimic how production chat apps are structured.",
    },
    {
        title: "Workspaces & channels",
        body: "A workspace is your island—a team, class project, or friend group. Inside it, channels organize conversation by topic (#general, #bugs, #memes). Invite others with a workspace ID. It is intentionally simple: fewer concepts, faster onboarding, same mental model as tools you already use.",
    },
    {
        title: "Real-time layer",
        body: "HTTP loads history; sockets push the present. When you send a message, the server persists it and the room hears it. Typing events are ephemeral—little sparks that say “someone is here.” Online indicators are the social glue: who is actually at the keyboard right now.",
    },
    {
        title: "Security notes",
        body: "Passwords are hashed; tokens expire. Never commit secrets. In production, lock down CORS, use HTTPS everywhere, and treat your JWT secret like a root password. This project is a sandbox for ideas—carry those habits into anything public-facing.",
    },
    {
        title: "Roadmap (dream big)",
        body: "Replies and threads, reactions, file uploads, voice rooms, mobile clients, E2E encryption for DMs, moderation tools, bots, and searchable archives. The architecture you see here is a launchpad: the interesting part is what you bolt on next.",
    },
]

export default function About() {
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-chat-bg">
            <header className="shrink-0 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-md md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">
                        Project codex
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                        About Workspace Chat
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                        Everything below is the story of the app—deeper than a
                        typical README, weirder than a syllabus, and honest
                        about what works, what is fake, and what is next.
                    </p>
                </motion.div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-6">
                <motion.div
                    variants={fadeContainer}
                    initial="hidden"
                    animate="visible"
                    className="mx-auto max-w-3xl space-y-6 pb-16"
                >
                    <motion.article
                        variants={fadeItem}
                        className="rounded-2xl border border-slate-200/80 bg-linear-to-br from-white to-violet-50/40 p-6 shadow-sm md:p-8"
                    >
                        <h2 className="text-lg font-semibold text-slate-900">
                            Read me like a GitHub repo—then keep scrolling
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">
                            If you landed here from a class demo or a portfolio
                            link: welcome. This document is both marketing and
                            manual. It explains the product narrative, the
                            technical spine, and the creative intent—because
                            software without a story is just noise in a
                            terminal.
                        </p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            {["Workspaces", "Socket.io", "Motion UI"].map(
                                (label, i) => (
                                    <motion.div
                                        key={label}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.08 * i }}
                                        className="rounded-xl border border-violet-200/60 bg-white/80 px-3 py-2 text-center text-xs font-medium text-violet-800"
                                    >
                                        {label}
                                    </motion.div>
                                ),
                            )}
                        </div>
                    </motion.article>

                    {sections.map((s, i) => (
                        <motion.section
                            key={s.title}
                            variants={fadeItem}
                            className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm md:p-7"
                        >
                            <div className="flex items-baseline gap-3">
                                <span className="font-mono text-xs text-violet-500">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <h2 className="text-base font-semibold text-slate-900">
                                    {s.title}
                                </h2>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                {s.body}
                            </p>
                        </motion.section>
                    ))}

                    <motion.footer
                        variants={fadeItem}
                        className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center"
                    >
                        <p className="text-sm italic text-slate-500">
                            Built with curiosity. Deployed with hope. Debugged
                            with coffee.
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                            Use the sidebar to return to chat whenever reality
                            calls.
                        </p>
                    </motion.footer>
                </motion.div>
            </div>
        </div>
    )
}
