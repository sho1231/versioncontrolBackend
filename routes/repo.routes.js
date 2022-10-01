const routes = require('express').Router();
const { createRepo, getRepos, searchRepos, deleteRepos } = require('../services/repo.services');


routes.post("/createrepo", createRepo);
routes.get("/getrepo", getRepos);
routes.get("/search", searchRepos);
routes.delete("/delete", deleteRepos);

module.exports = routes