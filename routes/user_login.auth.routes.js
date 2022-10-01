const routes = require('express').Router();
const { register, login } = require('../services/user_login.services')


routes.post("/register", register);
routes.post("/login", login);

module.exports = routes;