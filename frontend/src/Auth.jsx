import { useState } from "react"
import axios from "axios"
import { motion } from "motion/react"
import { API_BASE } from "./config"
import { fadeContainer, fadeItem, listRow } from "./motionVariants"

function Auth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [username, setUsername] = useState("")
    const [error, setError] = useState("")
    const [info, setInfo] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setInfo("")
        setLoading(true)
        try {
            if (isLogin) {
                const res = await axios.post(`${API_BASE}/api/auth/login`, {
                    email,
                    password,
                })
                onLogin(res.data.token, res.data.user?.username)
            } else {
                await axios.post(`${API_BASE}/api/auth/register`, {
                    username,
                    email,
                    password,
                })
                setIsLogin(true)
                setError("")
                setPassword("")
                setInfo(
                    "Account created. Sign in with your email and password.",
                )
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Something went wrong. Try again.",
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-full items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-violet-950 p-6">
            <motion.div
                className="w-full max-w-md"
                variants={fadeContainer}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={fadeItem} className="mb-8 text-center">
                    <motion.div
                        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25"
                        whileHover={{ scale: 1.05, rotate: -2 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 18,
                        }}
                    >
                        <span className="text-xl font-bold text-white">W</span>
                    </motion.div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                        {isLogin ? "Welcome back" : "Create an account"}
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        {isLogin
                            ? "Sign in to your workspace"
                            : "Join Workspace Chat in seconds"}
                    </p>
                </motion.div>

                <motion.div
                    variants={fadeItem}
                    className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-md"
                >
                    <form
                        className="flex flex-col gap-4"
                        onSubmit={handleSubmit}
                    >
                        <AnimateFields
                            isLogin={isLogin}
                            username={username}
                            setUsername={setUsername}
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPassword={setPassword}
                        />

                        {error ? (
                            <motion.p
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center text-sm text-rose-400"
                            >
                                {error}
                            </motion.p>
                        ) : null}
                        {info ? (
                            <motion.p
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center text-sm text-emerald-400/90"
                            >
                                {info}
                            </motion.p>
                        ) : null}

                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="mt-2 rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 disabled:cursor-not-allowed disabled:opacity-60"
                            variants={listRow}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                        >
                            {loading
                                ? "Please wait…"
                                : isLogin
                                  ? "Sign in"
                                  : "Sign up"}
                        </motion.button>
                    </form>

                    <motion.button
                        type="button"
                        className="mt-6 w-full text-center text-sm text-violet-300/90 underline-offset-4 hover:text-violet-200 hover:underline"
                        onClick={() => {
                            setIsLogin(!isLogin)
                            setError("")
                            setInfo("")
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLogin
                            ? "Don't have an account? Register"
                            : "Already have an account? Sign in"}
                    </motion.button>
                </motion.div>
            </motion.div>
        </div>
    )
}

function AnimateFields({
    isLogin,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
}) {
    return (
        <>
            {!isLogin ? (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                >
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">
                        Username
                    </label>
                    <input
                        type="text"
                        placeholder="jane_doe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required={!isLogin}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none ring-violet-500/40 transition placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-2"
                    />
                </motion.div>
            ) : null}
            <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Email
                </label>
                <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none ring-violet-500/40 transition placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-2"
                />
            </div>
            <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Password
                </label>
                <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none ring-violet-500/40 transition placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-2"
                />
            </div>
        </>
    )
}

export default Auth
