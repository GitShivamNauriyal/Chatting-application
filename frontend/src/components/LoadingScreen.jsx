import { motion } from "motion/react"
import { fadeContainer, fadeItem } from "../motionVariants"

export default function LoadingScreen({
    title = "Workspace Chat",
    subtitle = "Syncing your workspaces…",
}) {
    return (
        <div className="flex min-h-full items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-violet-950 p-6">
            <motion.div
                className="flex max-w-md flex-col items-center gap-8 text-center"
                variants={fadeContainer}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={fadeItem} className="relative">
                    <motion.div
                        className="h-20 w-20 rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30"
                        animate={{ rotate: [0, 2, -2, 0] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-white/20"
                        animate={{
                            scale: [1, 1.08, 1],
                            opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                            duration: 1.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                </motion.div>

                <motion.div variants={fadeItem} className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                        {title}
                    </h1>
                    <p className="text-sm text-slate-400">{subtitle}</p>
                </motion.div>

                <motion.div variants={fadeItem} className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            className="h-2 w-2 rounded-full bg-violet-400"
                            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                            transition={{
                                duration: 0.7,
                                repeat: Infinity,
                                delay: i * 0.12,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </motion.div>
            </motion.div>
        </div>
    )
}
