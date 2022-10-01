const mongo = require('../shared/mongo');
const { repo_schema, isError } = require('../shared/schema')

module.exports = {
    async createRepo(req, res) {
        try {
            const message = await isError(repo_schema, req.body);
            if (message) return res.status(400).json(message);
            const repo = await mongo.repo.find({ owner: mongo.ObjectId(req.id) }).toArray();
            console.log(repo);
            if (repo.length !== 0) {
                for (let i in repo) {
                    if (repo[i].name === req.body.name) return res.status(400).json({ message: "Repo with this name already exist" })
                }
            }
            req.body.owner = mongo.ObjectId(req.id);
            const new_repo = await mongo.repo.insertOne({ ...req.body });
            const branch = {
                name: 'main',
                user: mongo.ObjectId(req.id),
                files: [],
                repo: new_repo.insertedId
            };
            await mongo.branches.insertOne({ ...branch });
            res.status(200).json({ message: "Success" });
        }
        catch (e) {
            console.log("From createRepo error: " + e);
            res.status(500).json({ Message: "Internal error" });
        }
    },
    async getRepos(req, res) {
        try {
            let repos = await mongo.repo.find({ owner: mongo.ObjectId(req.id) }, { projection: { owner: 0 } }).toArray();
            await Promise.all(repos.map(async (repo) => {
                const branches = await mongo.branches.find({ repo: repo._id }).toArray();
                repo.total_branches = branches.length
                return repo;
            }))
            res.status(200).json(repos);
        }
        catch (e) {
            console.log("From getRepos", e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async searchRepos(req, res) {
        try {
            const data = await mongo.repo.find({ name: { $regex: `${req.query.q}`, $options: "i" } }, { projection: { name: 1 } }).toArray();
            res.status(200).json(data);
        }
        catch (e) {
            console.log("From getSearchRepos", e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async deleteRepos(req, res) {
        try {
            const repo = await mongo.repo.findOne({ _id: mongo.ObjectId(req.body.id) });
            if (!repo) return res.status(404).json({ message: "Repository not found" });
            if (!repo.owner.equals(mongo.ObjectId(req.id))) return res.status(403).json({ message: "Unauthorized access" });
            const branches = await mongo.branches.find({ repo: mongo.ObjectId(repo._id) }).toArray();
            Promise.all(branches.map(async (branch) => await mongo.files.deleteMany({ branch: mongo.ObjectId(branch._id) })));
            await mongo.branches.deleteMany({ repo: mongo.ObjectId(repo._id) });
            await mongo.repo.deleteOne({ _id: mongo.ObjectId(repo._id) });
            res.status(200).json({ message: "Repository deleted" });
        }
        catch (e) {
            console.log("From deleteRepos", e);
            res.status(500).json({ message: "Internal error" });
        }
    }
}