const mongo = require('../shared/mongo');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { registration_schema, login_schema, isError } = require('../shared/schema');
const bcrypt = require('bcrypt');


dotenv.config();

module.exports = {
    async register(req, res) {
        try {
            const message = await isError(registration_schema, req.body,);
            if (message) return res.status(401).json(message);
            const user = await mongo.users.findOne({ username: req.body.username });
            if (user) return res.status(400).json({ message: "User already registered" });
            delete req.body.cpass;
            req.body.pass = await bcrypt.hash(req.body.pass, await bcrypt.genSalt(6));
            await mongo.users.insertOne(req.body);
            res.status(200).json({ message: "User registered successfully" });
        }
        catch (e) {
            console.log("From register", e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async login(req, res) {
        try {
            const message = await isError(login_schema, req.body,);
            if (message) return res.status(401).json(message);
            const user = await mongo.users.findOne({ username: req.body.username });
            // console.log(user);
            if (!user) return res.status(400).json({ message: "Username invalid" });
            const isValid = await bcrypt.compare(req.body.pass, user.pass);
            if (!isValid) return res.status(401).json({ message: "Invalid password" });
            const auth_token = jwt.sign({ _id: user._id }, process.env.KEY, {
                expiresIn: "6h",
            });
            res.status(200).json({ message: "Login success", token: auth_token });
        }
        catch (e) {
            console.log("From login", e);
            res.status(500).json({ message: "Internal error" });
        }
    }
}