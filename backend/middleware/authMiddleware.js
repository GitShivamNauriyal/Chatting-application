const jwt = require("jsonwebtoken")

module.exports = function (req, res, next) {
    // 1. Get the token from the header of the incoming request
    const authHeader = req.header("Authorization")

    // 2. If there is no token, deny access
    if (!authHeader) {
        return res
            .status(401)
            .json({ message: "No token, authorization denied" })
    }

    try {
        // Tokens usually come in the format: "Bearer eyJhbGci..."
        // We split it to just get the actual token string
        const token = authHeader.split(" ")[1]

        // 3. Verify the token using our secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // 4. Attach the decoded user data (like userId) to the request
        req.user = decoded

        // 5. Let them pass to the actual API route
        next()
    } catch (err) {
        res.status(401).json({ message: "Token is not valid" })
    }
}
