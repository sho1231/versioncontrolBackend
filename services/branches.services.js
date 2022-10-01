const { branch_schema, isError } = require('../shared/schema');
const mongo = require('../shared/mongo');
const fs = require('fs');
const { files } = require('../shared/mongo');
const path = require("path");

module.exports = {
    async createBranch(req, res) {
        try {
            const message = await isError(branch_schema, req.body);
            if (message) return res.status(400).json(message);
            const repo = await mongo.repo.findOne({ _id: mongo.ObjectId(req.body.repo) });
            if (!repo) return res.status(404).json({ message: "Repo does not exist" });
            const branches = await mongo.branches.find({ repo: mongo.ObjectId(req.body.repo) }).toArray();
            for (let i in branches) {
                if (branches[i]["name"] == req.body.name) return res.status(400).json({ message: "Branch already exist" });
            }
            req.body.repo = mongo.ObjectId(req.body.repo);
            req.body.user = mongo.ObjectId(req.id);
            await mongo.branches.insertOne({ ...req.body });
            res.status(200).json({ Message: "success" });
        }
        catch (e) {
            console.log("From createBranch", e);
            res.status(500).json({ Message: "Internal error" });
        }
    },
    async deleteBranch(req, res) {
        try {
            const branch = await mongo.branches.findOne({ _id: mongo.ObjectId(req.body.branchId) });
            if (!branch) return res.status(404).json({ Message: "Branch not found" })
            const repo = await mongo.repo.findOne({ _id: mongo.ObjectId(branch.repo) });
            if (!repo) return res.status(404).json({ Message: "Repo not found" });
            if (!branch.user.equals(mongo.ObjectId(req.id)) && !repo.owner.equals(mongo.ObjectId(req.id))) return res.status(403).json({ message: "Unauthorized access" });
            if (branch.name === 'main') return res.status(400).json({ message: "Main cannot be deleted" })
            await mongo.files.deleteMany({ branch: mongo.ObjectId(branch._id) });
            await mongo.branches.deleteOne({ _id: mongo.ObjectId(branch._id) })
            res.status(200).json({ messgae: "Success" });
        }
        catch (e) {
            console.log(e);
            res.status(500).json({ Message: "Internal error" });
        }
    },
    async uploadFile(req, res) {
        let uploadFiles = [];
        try {
            console.log(req.id, req.body.branchId);
            // console.log(dir);
            const branch = await mongo.branches.findOne({ _id: mongo.ObjectId(req.body.branchId) });
            if (!branch) {
                const files = fs.readdirSync('./uploads');
                for (let i in files) {
                    fs.unlinkSync(`./uploads/${files[i]}`);
                }
                return res.status(404).json({ Message: "Branch does not exist" });
            }
            const repo = await mongo.repo.findOne({ _id: mongo.ObjectId(branch.repo) });
            console.log(`${branch.user} ${req.id} = ${!branch.user.equals(mongo.ObjectId(req.id))}`)
            console.log(`${repo.owner} ${req.id} =${!repo.owner.equals(mongo.ObjectId(req.id))}`)
            if (!branch.user.equals(mongo.ObjectId(req.id)) && !repo.owner.equals(mongo.ObjectId(req.id))) {
                const files = fs.readdirSync(`./uploads`);
                for (let i in files) {
                    fs.unlinkSync(`./uploads/${files[i]}`);
                }
                return res.status(403).json({ Message: "Unauthorized access" });
            }
            const files = fs.readdirSync(`./uploads`);
            for (let i in files) {
                let obj = {};
                let file_type = files[i].split(".").pop();
                obj["file_name"] = files[i];
                obj["file_data"] = fs.readFileSync(`./uploads/${files[i]}`, { encoding: "base64" });
                obj["file_type"] = file_type;
                obj["branch"] = branch._id;
                uploadFiles.push(obj);
            }
            console.log(uploadFiles.length);
            await mongo.files.insertMany(uploadFiles);
            for (let i in files) {
                fs.unlinkSync(`./uploads/${files[i]}`);
            }
            res.status(200).json({ message: files });
        }
        catch (e) {
            const files = fs.readdirSync(`./uploads`);
            for (let i in files) {
                fs.unlinkSync(`./uploads/${files[i]}`);
            }
            console.log(e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async getFiles(req, res) {
        try {
            const branch = await mongo.branches.findOne({ repo: mongo.ObjectId(req.params.repo), name: req.query.name });
            if (!branch) {
                return res.status(404).json({ Message: "Branch does not exist" });
            }
            const repo = await mongo.repo.findOne({ _id: mongo.ObjectId(branch.repo) });
            const files = await mongo.files.find({ branch: branch._id }, { projection: { file_name: 1 } }).toArray();
            res.status(200).json(files);

        }
        catch (e) {
            console.log(e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async getFilesForCommit(req, res) {
        try {
            const branch = await mongo.branches.findOne({ repo: mongo.ObjectId(req.params.repo), name: req.query.name });
            if (!branch) {
                return res.status(404).json({ Message: "Branch does not exist" });
            }
            const repo = await mongo.repo.findOne({ _id: mongo.ObjectId(branch.repo) });
            const files = await mongo.files.find({ branch: branch._id }, { projection: { file_name: 1, file_data: 1, file_type: 1, branch: 1 } }).toArray();
            files.map((data) => {
                if (data.file_type !== "jpg" && data.file_type !== "jpeg" && data.file_type !== "png") {
                    console.log("Not a image file")
                    data.file_data = Buffer.from(data.file_data, 'base64').toString('utf8');
                }
            })
            res.status(200).json(files);

        }
        catch (e) {
            console.log(e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async getBranch(req, res) {
        try {
            //check if repo exists or not
            console.log("repo", req.params.repo);
            const repo = await mongo.repo.findOne({ _id: mongo.ObjectId(req.params.repo) })
            if (!repo) return res.status(404).json({ message: "Repo does not exist" });
            const branch = await mongo.branches.find({ repo: mongo.ObjectId(repo._id) }, { projection: { name: 1 } }).toArray();
            res.status(200).json(branch);
        }
        catch (e) {
            console.log(e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async getSelectiveBranch(req, res) {
        try {
            let data;
            const repo = await mongo.repo.findOne({ _id: mongo.ObjectId(req.query.repoId) });
            console.log(repo.owner);
            if (repo.owner.equals(mongo.ObjectId(req.id))) {
                data = await mongo.branches.find({ repo: mongo.ObjectId(req.query.repoId) }).toArray();
            }
            else {
                data = await mongo.branches.find({ repo: mongo.ObjectId(req.query.repoId), user: mongo.ObjectId(req.id) }).toArray()
            }
            res.status(200).json(data);
        }
        catch (e) {
            console.log(e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async getFile(req, res) {
        try {
            const data = await mongo.files.findOne({ _id: mongo.ObjectId(req.params.fileId) })
            if (!data) return res.status(404).json({ message: "File not found" });
            console.log(data.file_type);
            const branch = await mongo.branches.findOne({ _id: mongo.ObjectId(data.branch) });
            if (!branch) return res.status(404).json({ message: "Branch not found" });
            const repo = await mongo.repo.findOne({ _id: mongo.ObjectId(branch.repo) });
            if (!repo) res.status(404).json({ message: "Repo not found" });
            console.log(`${branch.user} ${req.id} ${branch.user.equals(mongo.ObjectId(req.id))}`);
            console.log(`${repo.owner} ${req.id} ${repo.owner.equals(mongo.ObjectId(req.id))}`);
            data.hasAccess = !(!branch.user.equals(mongo.ObjectId(req.id)) && !repo.owner.equals(mongo.ObjectId(req.id)));
            if (data.file_type !== "jpg" && data.file_type !== "jpeg" && data.file_type !== "png") {
                console.log("Not a image file")
                data.file_data = Buffer.from(data.file_data, 'base64').toString('utf8');
            }
            res.status(200).json(data);
        }
        catch (e) {
            console.log(e);
            res.status(500).json({ message: "Internal error" })
        }
    },
    async deleteFile(req, res) {
        try {
            const file = await mongo.files.findOne({ _id: mongo.ObjectId(req.body.fileId) });
            if (!file) return res.status(404).json({ message: "File not found" });
            const branch = await mongo.branches.findOne({ _id: mongo.ObjectId(file.branch) });
            const repo = await mongo.repo.findOne({ _id: mongo.ObjectId(branch.repo) });
            if (!branch.user.equals(mongo.ObjectId(req.id)) && !repo.owner.equals(mongo.ObjectId(req.id))) return res.status(403).json({ message: "Unauthorized access" })
            await mongo.files.deleteOne({ _id: mongo.ObjectId(req.body.fileId) });
            res.status(200).json({ message: "File successfully deleted", repoId: repo._id, branchName: branch.name });
        }
        catch (e) {
            console.log(e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async editFiles(req, res) {
        try {
            const file = await mongo.files.findOne({ _id: mongo.ObjectId(req.body.fileId) });
            if (!file) return res.status(404).json({ message: "File not found" });
            const branch = await mongo.branches.findOne({ _id: mongo.ObjectId(file.branch) });
            const repo = await mongo.repo.findOne({ _id: mongo.ObjectId(branch.repo) });
            if (!branch.user.equals(mongo.ObjectId(req.id)) && !repo.owner.equals(mongo.ObjectId(req.id))) return res.status(403).json({ message: "Unauthorized access" })
            const file_data = Buffer.from(req.body.file_data).toString('base64');
            await mongo.files.updateOne({ _id: mongo.ObjectId(req.body.fileId) }, { $set: { file_data: file_data } });
            res.status(200).json({ message: "File edited successfully" })
        }
        catch (e) {
            console.log(e);
            res.status(500).json({ message: "Internal error" });
        }
    },
    async commitFiles(req, res) {
        try {
            req.body.map((file) => {
                if (file.file_type !== 'jpg' && file.file_type !== 'jpeg' && file.file_type !== 'png') {
                    file.file_data = Buffer.from(file.file_data).toString('base64');
                }
                file.branch = mongo.ObjectId(file.branch);
                delete file._id
            });
            const del = await mongo.files.deleteMany({ branch: mongo.ObjectId(req.body[0].branch) });
            const commit = await mongo.files.insertMany(req.body);
            console.log(commit);
            res.status(200).json({ message: commit });
        }
        catch (e) {
            console.log(e);
            res.status(500).json({ message: "Internal error" });
        }
    }
}