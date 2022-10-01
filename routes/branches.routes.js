const routes = require('express').Router();
const { createBranch, uploadFile, getFiles, getBranch, getFile, deleteFile, getSelectiveBranch, deleteBranch, editFiles, getFilesForCommit, commitFiles } = require('../services/branches.services');
const multer = require('multer');

var storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, './uploads')
    },
    filename: (request, file, cb) => {
        cb(null, file.originalname);
    }
})

const upload = multer({ storage: storage })

routes.post("/createbranch", createBranch);
routes.post("/upload", upload.array('file'), uploadFile);
routes.get("/getfiles/:repo", getFiles);
routes.get("/getBranch/:repo", getBranch);
routes.get("/getFile/:fileId", getFile);
routes.get("/getfilesforcommit/:repo", getFilesForCommit);
routes.delete("/deleteFile", deleteFile);
routes.delete("/deleteBranch", deleteBranch)
routes.get("/getSelectiveBranch", getSelectiveBranch);
routes.put("/editFiles", editFiles);
routes.post("/commit", commitFiles);
module.exports = routes;