import { motion } from "motion/react"
import { fadeContainer, fadeItem } from "../motionVariants"

export default function Team() {
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-chat-bg">
            <header className="border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md md:px-6">
                <h1 className="text-lg font-semibold text-slate-900">Team</h1>
                <p className="text-xs text-slate-500">
                    Credits and collaborators will appear here.
                </p>
            </header>
            <div className="flex flex-1 items-center justify-center p-8">
                <motion.div
                    variants={fadeContainer}
                    initial="hidden"
                    animate="visible"
                    className="max-w-md text-center"
                >
                    <motion.div
                        variants={fadeItem}
                        className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-dashed border-violet-400/40 bg-violet-500/5"
                    >
                        <span className="text-4xl opacity-40">◇</span>
                    </motion.div>
                    <motion.p
                        variants={fadeItem}
                        className="text-sm text-slate-500"
                    >
                        This space is reserved for the team page. Content coming
                        soon.
                    </motion.p>
                </motion.div>
            </div>
        </div>
    )
}
