import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import Auth from "./Auth"
import Chat from "./Chat"
import { screenTransition } from "./motionVariants"

function App() {
    const [token, setToken] = useState(localStorage.getItem("token") || "")

    const handleLogin = (newToken) => {
        localStorage.setItem("token", newToken)
        setToken(newToken)
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        setToken("")
    }

    return (
        <div className="h-full min-h-0">
            <AnimatePresence mode="wait">
                {token ? (
                    <motion.div
                        key="chat"
                        className="h-full min-h-0"
                        variants={screenTransition}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <Chat token={token} onLogout={handleLogout} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="auth"
                        className="h-full min-h-0"
                        variants={screenTransition}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <Auth onLogin={handleLogin} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default App
