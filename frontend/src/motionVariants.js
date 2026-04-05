export const fadeContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.08 },
    },
}

export const fadeItem = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 420, damping: 28 },
    },
}

export const screenTransition = {
    initial: { opacity: 0, scale: 0.98, filter: "blur(6px)" },
    animate: {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
        opacity: 0,
        scale: 1.02,
        filter: "blur(4px)",
        transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
    },
}

export const listRow = {
    rest: { scale: 1, x: 0 },
    hover: {
        scale: 1.01,
        x: 4,
        transition: { type: "spring", stiffness: 400, damping: 22 },
    },
    tap: { scale: 0.98 },
}

export const messageBubble = {
    hidden: (isMine) => ({
        opacity: 0,
        x: isMine ? 28 : -28,
        scale: 0.94,
    }),
    visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 380, damping: 26 },
    },
    exit: {
        opacity: 0,
        scale: 0.92,
        transition: { duration: 0.2 },
    },
}

export const panelSwitch = {
    initial: { opacity: 0, x: 16 },
    animate: {
        opacity: 1,
        x: 0,
        transition: { type: "spring", stiffness: 320, damping: 30 },
    },
    exit: { opacity: 0, x: -12, transition: { duration: 0.2 } },
}

export const modalBackdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const modalContent = {
    hidden: { opacity: 0, scale: 0.92, y: 16 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring", stiffness: 380, damping: 28 },
    },
    exit: {
        opacity: 0,
        scale: 0.96,
        y: 8,
        transition: { duration: 0.18 },
    },
}
