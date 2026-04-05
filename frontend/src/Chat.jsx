import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import io from "socket.io-client"
import { AnimatePresence, motion } from "motion/react"
import { API_BASE } from "./config"
import LoadingScreen from "./components/LoadingScreen"
import {
    listRow,
    messageBubble,
    modalBackdrop,
    modalContent,
    panelSwitch,
} from "./motionVariants"

const socket = io(API_BASE, {
    transports: ["websocket"],
    withCredentials: true,
})

function Chat({ token, onLogout }) {
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState("")

    const [workspaces, setWorkspaces] = useState([])
    const [activeWorkspace, setActiveWorkspace] = useState(null)

    const [channels, setChannels] = useState([])
    const [activeChannel, setActiveChannel] = useState(null)

    const [typingUser, setTypingUser] = useState(null)
    const [onlineUsers, setOnlineUsers] = useState([])

    const [bootstrapping, setBootstrapping] = useState(true)
    const [modal, setModal] = useState(null)
    const [modalInput, setModalInput] = useState("")
    const [modalBusy, setModalBusy] = useState(false)
    const [inviteCopied, setInviteCopied] = useState(false)

    const modalType = modal?.type ?? null

    const typingTimeoutRef = useRef(null)
    const messagesEndRef = useRef(null)

    const payload = JSON.parse(atob(token.split(".")[1]))
    const currentUserId = payload.userId || payload._id
    const currentUsername = payload.username || payload.name || "Someone"

    const axiosConfig = useMemo(
        () => ({ headers: { Authorization: `Bearer ${token}` } }),
        [token],
    )

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, typingUser])

    useEffect(() => {
        setInviteCopied(false)
    }, [activeWorkspace?._id])

    const loadChannelData = useCallback(
        async (channel) => {
            setActiveChannel(channel)
            try {
                const msgRes = await axios.get(
                    `${API_BASE}/api/messages/${channel._id}`,
                    axiosConfig,
                )
                setMessages(msgRes.data)
                socket.emit("join_channel", channel._id)
            } catch (err) {
                console.error("Error loading messages", err)
            }
        },
        [axiosConfig],
    )

    const loadWorkspaceData = useCallback(
        async (workspace) => {
            setActiveWorkspace(workspace)
            try {
                const chRes = await axios.get(
                    `${API_BASE}/api/channels/${workspace._id}`,
                    axiosConfig,
                )
                setChannels(chRes.data)

                if (chRes.data.length > 0) {
                    await loadChannelData(chRes.data[0])
                } else {
                    setActiveChannel(null)
                    setMessages([])
                }
            } catch (err) {
                console.error("Error loading workspace data", err)
            }
        },
        [axiosConfig, loadChannelData],
    )

    const refreshWorkspaces = useCallback(async () => {
        const wsRes = await axios.get(`${API_BASE}/api/workspaces`, axiosConfig)
        setWorkspaces(wsRes.data)
        return wsRes.data
    }, [axiosConfig])

    useEffect(() => {
        let cancelled = false

        const bootstrap = async () => {
            setBootstrapping(true)
            try {
                const wsRes = await axios.get(
                    `${API_BASE}/api/workspaces`,
                    axiosConfig,
                )
                if (cancelled) return
                setWorkspaces(wsRes.data)
                if (wsRes.data.length > 0) {
                    await loadWorkspaceData(wsRes.data[0])
                }
            } catch (err) {
                console.error("Error fetching data", err)
            } finally {
                if (!cancelled) setBootstrapping(false)
            }
        }

        bootstrap()

        socket.emit("register_user", currentUserId)

        socket.on("receive_message", (message) => {
            setMessages((prev) => [...prev, message])
        })

        socket.on("user_typing", (username) => {
            setTypingUser(username)
        })

        socket.on("user_stopped_typing", () => {
            setTypingUser(null)
        })

        socket.on("online_users", (usersArray) => {
            setOnlineUsers(usersArray)
        })

        socket.on("message_deleted", (deletedMessageId) => {
            setMessages((prev) =>
                prev.filter((msg) => msg._id !== deletedMessageId),
            )
        })

        return () => {
            cancelled = true
            socket.off("receive_message")
            socket.off("user_typing")
            socket.off("user_stopped_typing")
            socket.off("online_users")
            socket.off("message_deleted")
        }
    }, [token, currentUserId, axiosConfig, loadWorkspaceData])

    const openModal = (type) => {
        setModalInput("")
        setModal({ type })
    }

    const closeModal = () => {
        if (modalBusy) return
        setModal(null)
        setModalInput("")
    }

    const handleCreateWorkspace = async () => {
        const name = modalInput.trim()
        if (!name) return
        setModalBusy(true)
        try {
            await axios.post(
                `${API_BASE}/api/workspaces`,
                { name },
                axiosConfig,
            )
            const list = await refreshWorkspaces()
            if (list.length > 0) {
                const created = list[list.length - 1]
                await loadWorkspaceData(created)
            }
            closeModal()
        } catch (e) {
            console.error("Error creating workspace:", e)
        } finally {
            setModalBusy(false)
        }
    }

    const handleJoinWorkspace = async () => {
        const joinId = modalInput.trim()
        if (!joinId) return
        setModalBusy(true)
        try {
            await axios.post(
                `${API_BASE}/api/workspaces/join`,
                { workspaceId: joinId },
                axiosConfig,
            )
            const list = await refreshWorkspaces()
            const joined =
                list.find((w) => w._id === joinId) || list[list.length - 1]
            if (joined) await loadWorkspaceData(joined)
            closeModal()
        } catch (e) {
            alert(e.response?.data?.message || "Error joining workspace.")
        } finally {
            setModalBusy(false)
        }
    }

    const copyWorkspaceId = async () => {
        if (!activeWorkspace) return
        try {
            await navigator.clipboard.writeText(activeWorkspace._id)
            setInviteCopied(true)
            window.setTimeout(() => setInviteCopied(false), 2000)
        } catch {
            /* ignore */
        }
    }

    const handleCreateChannel = async () => {
        if (!activeWorkspace) return
        const channelName = modalInput.trim()
        if (!channelName) return
        setModalBusy(true)
        try {
            await axios.post(
                `${API_BASE}/api/channels/${activeWorkspace._id}`,
                { name: channelName },
                axiosConfig,
            )
            await loadWorkspaceData(activeWorkspace)
            closeModal()
        } catch (e) {
            console.error("Error creating channel:", e)
        } finally {
            setModalBusy(false)
        }
    }

    const handleDeleteMessage = async (messageId) => {
        setModalBusy(true)
        try {
            await axios.delete(
                `${API_BASE}/api/messages/${messageId}`,
                axiosConfig,
            )
            setMessages((prev) => prev.filter((msg) => msg._id !== messageId))
            socket.emit("delete_message", {
                messageId,
                channelId: activeChannel._id,
            })
            closeModal()
        } catch (e) {
            console.error("Error deleting message:", e)
            alert("Could not delete message.")
        } finally {
            setModalBusy(false)
        }
    }

    const handleTyping = (e) => {
        setNewMessage(e.target.value)

        if (activeChannel) {
            socket.emit("typing", {
                channelId: activeChannel._id,
                username: currentUsername,
            })
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit("stop_typing", activeChannel._id)
            }, 2000)
        }
    }

    const sendMessage = async (e) => {
        e.preventDefault()
        if (newMessage.trim() && activeChannel) {
            try {
                const res = await axios.post(
                    `${API_BASE}/api/messages`,
                    { content: newMessage, channelId: activeChannel._id },
                    axiosConfig,
                )

                const savedMessage = res.data
                setMessages((prev) => [...prev, savedMessage])

                const socketPayload = {
                    ...savedMessage,
                    channelId: activeChannel._id,
                }

                socket.emit("send_message", socketPayload)
                socket.emit("stop_typing", activeChannel._id)
                setNewMessage("")
            } catch (error) {
                console.error("Error sending message:", error)
                alert("Failed to send message. Please try again.")
            }
        }
    }

    if (bootstrapping) {
        return <LoadingScreen />
    }

    const modalTitle =
        modalType === "workspace"
            ? "New workspace"
            : modalType === "join"
              ? "Join workspace"
              : modalType === "channel"
                ? "New channel"
                : modalType === "delete"
                  ? "Delete message"
                  : ""

    const modalAction =
        modalType === "workspace"
            ? handleCreateWorkspace
            : modalType === "join"
              ? handleJoinWorkspace
              : modalType === "channel"
                ? handleCreateChannel
                : null

    return (
        <div className="flex h-full min-h-0 bg-slate-950 text-slate-100">
            <aside className="relative flex w-64 shrink-0 flex-col overflow-x-hidden border-r border-white/10 bg-sidebar px-3 pb-16 pt-4 md:w-72">
                <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    className="px-1"
                >
                    <h2 className="text-lg font-semibold tracking-tight text-white">
                        Workspace Chat
                    </h2>
                    <p className="text-xs text-slate-500">
                        Signed in as {currentUsername}
                    </p>
                </motion.div>

                <div className="mt-5 flex items-center justify-between px-1">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Workspaces
                    </h4>
                    <div className="flex gap-1">
                        <motion.button
                            type="button"
                            className="rounded-lg px-2 py-1 text-xs text-violet-300/90 hover:bg-white/5"
                            onClick={() => openModal("join")}
                            variants={listRow}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                        >
                            Join
                        </motion.button>
                        <motion.button
                            type="button"
                            className="rounded-lg px-2 py-0.5 text-lg leading-none text-slate-400 hover:bg-white/5 hover:text-white"
                            onClick={() => openModal("workspace")}
                            variants={listRow}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                            aria-label="Create workspace"
                        >
                            +
                        </motion.button>
                    </div>
                </div>

                <div className="mt-1 max-h-32 space-y-0.5 overflow-x-hidden overflow-y-auto pr-1">
                    {workspaces.map((ws) => (
                        <div
                            key={ws._id}
                            className="min-w-0 overflow-hidden rounded-lg"
                        >
                            <motion.button
                                type="button"
                                onClick={() => loadWorkspaceData(ws)}
                                variants={listRow}
                                initial="rest"
                                whileHover="hover"
                                whileTap="tap"
                                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                                    activeWorkspace?._id === ws._id
                                        ? "bg-white/10 font-medium text-white"
                                        : "text-slate-300 hover:bg-sidebar-hover"
                                }`}
                            >
                                <span className="truncate">{ws.name}</span>
                                <span
                                    className="shrink-0 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-400"
                                    title="Members"
                                >
                                    {ws.members?.length || 1}
                                </span>
                            </motion.button>
                        </div>
                    ))}
                </div>

                <div className="mt-5 flex items-center justify-between px-1">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Channels
                    </h4>
                    <motion.button
                        type="button"
                        onClick={() => openModal("channel")}
                        disabled={!activeWorkspace}
                        className="rounded-lg px-2 py-0.5 text-lg leading-none text-slate-400 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        variants={listRow}
                        initial="rest"
                        whileHover={activeWorkspace ? "hover" : "rest"}
                        whileTap={activeWorkspace ? "tap" : "rest"}
                        aria-label="Create channel"
                    >
                        +
                    </motion.button>
                </div>

                <div className="mt-1 max-h-32 space-y-0.5 overflow-x-hidden overflow-y-auto pr-1">
                    {channels.map((ch) => (
                        <div
                            key={ch._id}
                            className="min-w-0 overflow-hidden rounded-lg"
                        >
                            <motion.button
                                type="button"
                                onClick={() => loadChannelData(ch)}
                                variants={listRow}
                                initial="rest"
                                whileHover="hover"
                                whileTap="tap"
                                className={`block w-full truncate rounded-lg px-2 py-2 text-left text-sm ${
                                    activeChannel?._id === ch._id
                                        ? "bg-violet-600/90 font-medium text-white shadow-md shadow-violet-900/40"
                                        : "text-slate-300 hover:bg-sidebar-hover"
                                }`}
                            >
                                # {ch.name}
                            </motion.button>
                        </div>
                    ))}
                    {channels.length === 0 ? (
                        <p className="px-2 py-2 text-xs text-slate-500">
                            No channels yet
                        </p>
                    ) : null}
                </div>

                {activeWorkspace ? (
                    <>
                        <div className="mt-5 px-1">
                            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Members
                            </h4>
                        </div>
                        <div className="mt-1 flex-1 space-y-1 overflow-x-hidden overflow-y-auto pr-1">
                            {activeWorkspace.members?.map((member) => {
                                const memberId = member._id || member
                                const isOnline = onlineUsers.includes(memberId)
                                return (
                                    <motion.div
                                        key={memberId}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300"
                                    >
                                        <span
                                            className={`h-2 w-2 shrink-0 rounded-full ${
                                                isOnline
                                                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                                                    : "bg-slate-600"
                                            }`}
                                        />
                                        <span className="truncate">
                                            {member.username || "Unknown"}
                                            {memberId === currentUserId ? (
                                                <span className="ml-1 text-xs text-slate-500">
                                                    (you)
                                                </span>
                                            ) : null}
                                        </span>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </>
                ) : null}

                <motion.button
                    type="button"
                    onClick={onLogout}
                    className="absolute bottom-4 left-3 right-3 rounded-xl bg-rose-600/90 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-900/30"
                    whileHover={{ scale: 1.02, filter: "brightness(1.05)" }}
                    whileTap={{ scale: 0.98 }}
                >
                    Log out
                </motion.button>
            </aside>

            <section className="flex min-w-0 flex-1 flex-col bg-chat-bg">
                <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md md:px-6">
                    <AnimatePresence mode="wait">
                        <motion.h3
                            key={activeChannel?._id || "welcome"}
                            variants={panelSwitch}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="truncate text-lg font-semibold text-slate-900"
                        >
                            {activeChannel
                                ? `# ${activeChannel.name}`
                                : "Welcome"}
                        </motion.h3>
                    </AnimatePresence>
                    {activeWorkspace ? (
                        <motion.button
                            type="button"
                            onClick={copyWorkspaceId}
                            className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            animate={
                                inviteCopied ? { scale: [1, 1.06, 1] } : {}
                            }
                            transition={{ duration: 0.35 }}
                        >
                            {inviteCopied ? "Copied" : "Copy invite ID"}
                        </motion.button>
                    ) : null}
                </header>

                <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
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
                                {messages.map((msg) => {
                                    const isOnline = onlineUsers.includes(
                                        msg.sender?._id || msg.sender,
                                    )
                                    const isMyMessage =
                                        msg.sender?._id === currentUserId ||
                                        (!msg.sender?._id &&
                                            msg.sender === currentUserId)

                                    return (
                                        <motion.div
                                            key={
                                                msg._id ||
                                                `${msg.createdAt}-${msg.content}`
                                            }
                                            layout
                                            variants={messageBubble}
                                            custom={isMyMessage}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            className={`mb-4 flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm md:max-w-[70%] ${
                                                    isMyMessage
                                                        ? "rounded-br-md bg-linear-to-br from-violet-600 to-fuchsia-600 text-white"
                                                        : "rounded-bl-md border border-slate-200/80 bg-white text-slate-800"
                                                }`}
                                            >
                                                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs opacity-90">
                                                    <span className="font-semibold">
                                                        {msg.sender?.username ||
                                                            (isMyMessage
                                                                ? "You"
                                                                : "Someone")}
                                                    </span>
                                                    {isOnline ? (
                                                        <span
                                                            className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                                                            title="Online"
                                                        />
                                                    ) : null}
                                                    <span className="text-[11px] opacity-70">
                                                        {new Date(
                                                            msg.createdAt,
                                                        ).toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            },
                                                        )}
                                                    </span>
                                                    {isMyMessage && msg._id ? (
                                                        <motion.button
                                                            type="button"
                                                            onClick={() => {
                                                                setModalInput(
                                                                    "",
                                                                )
                                                                setModal({
                                                                    type: "delete",
                                                                    messageId:
                                                                        msg._id,
                                                                })
                                                            }}
                                                            className="ml-auto text-[11px] text-rose-200 hover:underline"
                                                            whileHover={{
                                                                scale: 1.05,
                                                            }}
                                                            whileTap={{
                                                                scale: 0.95,
                                                            }}
                                                        >
                                                            Delete
                                                        </motion.button>
                                                    ) : null}
                                                </div>
                                                <p className="text-sm leading-relaxed">
                                                    {msg.content}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )
                                })}
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
                                    Select or create a channel to start
                                    messaging.
                                </motion.p>
                            ) : null}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <form
                    onSubmit={sendMessage}
                    className="flex gap-3 border-t border-slate-200/80 bg-white/95 p-4 backdrop-blur-md md:px-6"
                >
                    <motion.input
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder={
                            activeChannel
                                ? `Message #${activeChannel.name}`
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
            </section>

            <AnimatePresence>
                {modal ? (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                        variants={modalBackdrop}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={closeModal}
                    >
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="modal-title"
                            variants={modalContent}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2
                                id="modal-title"
                                className="text-lg font-semibold text-white"
                            >
                                {modalTitle}
                            </h2>
                            {modalType === "delete" ? (
                                <p className="mt-2 text-sm text-slate-400">
                                    This message will be removed for everyone in
                                    the channel.
                                </p>
                            ) : (
                                <>
                                    <label className="mt-4 block text-xs font-medium text-slate-400">
                                        {modalType === "join"
                                            ? "Workspace invite ID"
                                            : "Name"}
                                    </label>
                                    <input
                                        autoFocus
                                        value={modalInput}
                                        onChange={(e) =>
                                            setModalInput(e.target.value)
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none ring-violet-500/30 focus:border-violet-500/50 focus:ring-2"
                                        placeholder={
                                            modalType === "join"
                                                ? "Paste invite ID"
                                                : "e.g. design-team"
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" &&
                                                modalAction
                                            ) {
                                                e.preventDefault()
                                                modalAction()
                                            }
                                        }}
                                    />
                                </>
                            )}
                            <div className="mt-6 flex justify-end gap-2">
                                <motion.button
                                    type="button"
                                    className="rounded-xl px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
                                    onClick={closeModal}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Cancel
                                </motion.button>
                                {modalType === "delete" ? (
                                    <motion.button
                                        type="button"
                                        disabled={modalBusy}
                                        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                        onClick={() =>
                                            handleDeleteMessage(modal.messageId)
                                        }
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {modalBusy ? "Deleting…" : "Delete"}
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        type="button"
                                        disabled={modalBusy}
                                        className="rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                        onClick={modalAction}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {modalBusy ? "Saving…" : "Confirm"}
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )
}

export default Chat
