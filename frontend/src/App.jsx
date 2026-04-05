import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom"
import Auth from "./Auth"
import Chat from "./Chat"
import About from "./pages/About"
import ChatMessagesView from "./pages/ChatMessagesView"
import Team from "./pages/Team"
import { screenTransition } from "./motionVariants"

function App() {
    const [token, setToken] = useState(localStorage.getItem("token") || "")
    const [storedUsername, setStoredUsername] = useState(
        () => localStorage.getItem("chat_username") || "",
    )

    const handleLogin = (newToken, username) => {
        localStorage.setItem("token", newToken)
        if (username) {
            localStorage.setItem("chat_username", username)
            setStoredUsername(username)
        } else {
            setStoredUsername(localStorage.getItem("chat_username") || "")
        }
        setToken(newToken)
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("chat_username")
        setStoredUsername("")
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
                        <BrowserRouter>
                            <Routes>
                                <Route
                                    element={
                                        <Chat
                                            token={token}
                                            onLogout={handleLogout}
                                            storedUsername={storedUsername}
                                        />
                                    }
                                >
                                    <Route
                                        path="/"
                                        element={
                                            <Navigate
                                                to="/chat"
                                                replace
                                            />
                                        }
                                    />
                                    <Route
                                        path="/chat"
                                        element={<ChatMessagesView />}
                                    />
                                    <Route
                                        path="/about"
                                        element={<About />}
                                    />
                                    <Route
                                        path="/team"
                                        element={<Team />}
                                    />
                                </Route>
                            </Routes>
                        </BrowserRouter>
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
