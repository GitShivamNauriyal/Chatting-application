import { useMemo, useRef, useState, useEffect, useCallback, memo } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useOutletContext } from "react-router-dom"
import { messageBubble, panelSwitch, listRow } from "../motionVariants"
import {
    dayDividerLabel,
    formatFullTimestamp,
    formatRelativeTime,
} from "../utils/chatTime"

export default function ChatMessagesView() {
    const {
        activeChannel,
        activeWorkspace,
        messages,
        newMessage,
        handleTyping,
        sendMessage,
        typingUser,
        onlineUsers,
        currentUserId,
        messagesEndRef,
        inviteCopied,
        copyWorkspaceId,
        setModal,
        setModalInput,
    } = useOutletContext()

    const [messageQuery, setMessageQuery] = useState("")
    const scrollRef = useRef(null)
    const [showJumpToBottom, setShowJumpToBottom] = useState(false)

    const filteredMessages = useMemo(() => {
        const q = messageQuery.trim().toLowerCase()
        if (!q) return messages
        return messages.filter((m) =>
            (m.content || "").toLowerCase().includes(q),
        )
    }, [messages, messageQuery])

    const messageRows = useMemo(() => {
        const rows = []
        let prevDay = null
        for (let i = 0; i < filteredMessages.length; i++) {
            const msg = filteredMessages[i]
            const dayKey = new Date(msg.createdAt).toDateString()
            if (prevDay !== dayKey) {
                rows.push({
                    kind: "divider",
                    key: `d-${dayKey}-${i}`,
                    date: msg.createdAt,
                })
                prevDay = dayKey
            }
            rows.push({
                kind: "msg",
                key: msg._id || `m-${msg.createdAt}-${i}`,
                msg,
            })
        }
        return rows
    }, [filteredMessages])

    const onScroll = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        const nearBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < 120
        setShowJumpToBottom(!nearBottom && messages.length > 0)
    }, [messages.length])

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        el.addEventListener("scroll", onScroll, { passive: true })
        onScroll()
        return () => el.removeEventListener("scroll", onScroll)
    }, [onScroll, activeChannel?._id])

    const jumpToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const copyText = async (text) => {
        try {
            await navigator.clipboard.writeText(text)
        } catch {
            /* ignore */
        }
    }

    let lastDayKey = null

    return (
        <>
            <header className="flex shrink-0 flex-col gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md md:flex-row md:items-center md:justify-between md:px-6">
                <AnimatePresence mode="wait">
                    <motion.h3
                        key={activeChannel?._id || "welcome"}
                        variants={panelSwitch}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="truncate text-lg font-semibold text-slate-900"
                    >
                        {activeChannel ? `# ${activeChannel.name}` : "Welcome"}
                    </motion.h3>
                </AnimatePresence>
                <div className="flex min-w-0 flex-1 flex-col gap-2 md:max-w-xs md:flex-none">
                    {activeChannel ? (
                        <input
                            type="search"
                            value={messageQuery}
                            onChange={(e) => setMessageQuery(e.target.value)}
                            placeholder="Search in channel…"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none ring-violet-500/20 placeholder:text-slate-400 focus:border-violet-400 focus:ring-2"
                        />
                    ) : null}
                    {activeWorkspace ? (
                        <motion.button
                            type="button"
                            onClick={copyWorkspaceId}
                            className="w-full shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 md:w-auto"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            animate={
                                inviteCopied ? { scale: [1, 1.04, 1] } : {}
                            }
                            transition={{ duration: 0.35 }}
                        >
                            {inviteCopied
                                ? "Copied invite ID"
                                : "Copy invite ID"}
                        </motion.button>
                    ) : null}
                </div>
            </header>

            <div
                ref={scrollRef}
                className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeChannel?._id || "empty"}
                        variants={panelSwitch}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="min-h-full"
                    >
                        <AnimatePresence initial={false}>
                            {messageRows.map((row) =>
                                row.kind === "divider" ? (
                                    <motion.div
                                        key={row.key}
                                        initial={{
                                            opacity: 0,
                                            scaleX: 0.9,
                                        }}
                                        animate={{ opacity: 1, scaleX: 1 }}
                                        className="my-6 flex items-center gap-3"
                                    >
                                        <div className="h-px flex-1 bg-slate-200" />
                                        <span className="shrink-0 rounded-full bg-slate-200/90 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                                            {dayDividerLabel(row.date)}
                                        </span>
                                        <div className="h-px flex-1 bg-slate-200" />
                                    </motion.div>
                                ) : (
                                    <MessageRow
                                        key={row.key}
                                        msg={row.msg}
                                        onlineUsers={onlineUsers}
                                        currentUserId={currentUserId}
                                        setModal={setModal}
                                        setModalInput={setModalInput}
                                        copyText={copyText}
                                    />
                                ),
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {typingUser ? (
                                <motion.p
                                    key={typingUser}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm italic text-slate-500"
                                >
                                    {typingUser} is typing…
                                </motion.p>
                            ) : null}
                        </AnimatePresence>

                        <div ref={messagesEndRef} />

                        {!activeChannel ? (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-16 text-center text-slate-500"
                            >
                                Select or create a channel to start messaging.
                            </motion.p>
                        ) : null}

                        {activeChannel &&
                        messageQuery.trim() &&
                        filteredMessages.length === 0 ? (
                            <p className="mt-8 text-center text-sm text-slate-500">
                                No messages match “{messageQuery.trim()}”.
                            </p>
                        ) : null}
                    </motion.div>
                </AnimatePresence>

                <AnimatePresence>
                    {showJumpToBottom ? (
                        <motion.button
                            type="button"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 12 }}
                            onClick={jumpToBottom}
                            className="absolute bottom-6 right-6 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            New messages ↓
                        </motion.button>
                    ) : null}
                </AnimatePresence>
            </div>

            <form
                onSubmit={sendMessage}
                className="flex shrink-0 flex-col gap-1 border-t border-slate-200/80 bg-white/95 p-4 backdrop-blur-md md:flex-row md:items-center md:gap-3 md:px-6"
            >
                <motion.input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder={
                        activeChannel
                            ? `Message #${activeChannel.name} · Enter to send`
                            : "Select a channel to start chatting…"
                    }
                    disabled={!activeChannel}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-violet-500/30 transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100"
                    whileFocus={{ scale: activeChannel ? 1.01 : 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                    }}
                />
                <motion.button
                    type="submit"
                    disabled={!activeChannel}
                    className="shrink-0 rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                    variants={listRow}
                    initial="rest"
                    whileHover={activeChannel ? "hover" : "rest"}
                    whileTap={activeChannel ? "tap" : "rest"}
                >
                    Send
                </motion.button>
            </form>
        </>
    )
}

const MessageRow = memo(function MessageRow({
    msg,
    onlineUsers,
    currentUserId,
    setModal,
    setModalInput,
    copyText,
}) {
    const isOnline = onlineUsers.includes(msg.sender?._id || msg.sender)
    const isMyMessage =
        msg.sender?._id === currentUserId ||
        (!msg.sender?._id && msg.sender === currentUserId)

    return (
        <motion.div
            layout
            variants={messageBubble}
            custom={isMyMessage}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`group mb-4 flex ${isMyMessage ? "justify-end" : "justify-start"}`}
        >
            <div
                className={`relative max-w-[85%] rounded-2xl px-4 py-2 shadow-sm md:max-w-[70%] ${
                    isMyMessage
                        ? "rounded-br-md bg-linear-to-br from-violet-600 to-fuchsia-600 text-white"
                        : "rounded-bl-md border border-slate-200/80 bg-white text-slate-800"
                }`}
            >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs opacity-90">
                    <span className="font-semibold">
                        {msg.sender?.username ||
                            (isMyMessage ? "You" : "Someone")}
                    </span>
                    {isOnline ? (
                        <span
                            className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                            title="Online"
                        />
                    ) : null}
                    <span
                        className="text-[11px] opacity-70"
                        title={formatFullTimestamp(msg.createdAt)}
                    >
                        {formatRelativeTime(msg.createdAt)}
                    </span>
                    <motion.button
                        type="button"
                        onClick={() => copyText(msg.content || "")}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium opacity-0 transition group-hover:opacity-100 ${
                            isMyMessage
                                ? "bg-white/15 text-white hover:bg-white/25"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Copy
                    </motion.button>
                    {isMyMessage && msg._id ? (
                        <motion.button
                            type="button"
                            onClick={() => {
                                setModalInput("")
                                setModal({
                                    type: "delete",
                                    messageId: msg._id,
                                })
                            }}
                            className="ml-auto text-[11px] text-rose-200 hover:underline"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Delete
                        </motion.button>
                    ) : null}
                </div>
                <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
        </motion.div>
    )
})
