const express = require("express");
const { urlencoded } = require("express")
const app = express();
const dotenv = require('dotenv');
const mongo = require('./shared/mongo');
const auth = require("./routes/user_login.auth.routes");
const repo = require("./routes/repo.routes");
const branches = require("./routes/branches.routes");
const cors = require('cors');
const bodyParser = require('body-parser');
const { maintain, check } = require('./shared/middleware');

dotenv.config();

(async () => {
    try {
        app.listen(process.env.PORT, () => console.log(`Listening in ${process.env.PORT}`));
        await mongo.connect();
        app.use(cors({
            origin: "*",
            credentials:true
        }));
        app.use(express.urlencoded({ extended: true, limit: "100mb" }));
        app.use(express.json({ limit: "100mb" }));
        app.use(maintain);
        app.get("/", (req, res) => res.send("running"));
        app.use("/auth", auth);
        app.use(check);
        app.use("/repo", repo);
        app.use("/branches", branches);
    }
    catch (e) {
        console.log("From index.js", e);
    }
})();
