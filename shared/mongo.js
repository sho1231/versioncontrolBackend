const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();
let mongo = {
    db: null,
    repo: null,
    users: null,
    branches: null,
    files: null,
    ObjectId,
    async connect() {
        try {
            const client = new MongoClient(process.env.MONGO_URL);
            await client.connect();
            this.db = client.db("VersionControl");
            this.users = await this.db.collection("users");
            this.repo = await this.db.collection("repo");
            this.branches = await this.db.collection("branches");
            this.files = await this.db.collection("files");
            console.log("Mongo connection success");
        }
        catch (e) {
            console.log("From Mongo.js");
            console.log(e);
        }
    }
}

module.exports = mongo;
