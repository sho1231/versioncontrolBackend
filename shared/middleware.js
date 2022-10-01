const jwt = require('jsonwebtoken');
const isMaintainenace = false;
const dotenv = require('dotenv');

dotenv.config();


module.exports = {
    maintain(req, res, next) {
        console.log("maintain")
        if (isMaintainenace) {
            console.log("under maintainenace");
            return res.status(500).json({ message: "Work going on..." });
        }
        console.log("lets go");
        next();
    },
    check(req, res, next) {
        console.log("lets go");
        try {
            // console.log("mid",123);
            if (req.headers && req.headers.authorization) {
                const [tokentype, token] = req.headers.authorization.split(" ");
                if (tokentype === "Bearer" && token) {
                    try {
                        console.log("Middleware:",jwt.verify(token, process.env.KEY));
                        let { _id } = jwt.verify(token, process.env.KEY);
                        // console.log(_id);
                        req.id = _id;
                        next();
                    }
                    catch (e) {
                        res.status(403).json({ message: "Invalid token" });
                    }
                }
                else {
                    res.status(401).json({ message: "Token missing" });
                }
            }
            else {
                res.status(401).json({ message: "Authorization needed" });
            }
        }
        catch (e) {
            console.log(e);
            res.status(500).json({ message: "something went wrong" });
        }
    }
}
