const joi = require('joi');

module.exports = {
    registration_schema: joi.object({
        username: joi.string().min(3).required(),
        pass: joi.string().min(1).required(),
        cpass: joi.ref('pass')
    }),
    login_schema: joi.object({
        username: joi.string().min(3).required(),
        pass: joi.string().min(1).required(),
    }),
    repo_schema: joi.object({
        name: joi.string().min(1).required(),
    }),
    branch_schema: joi.object({
        name: joi.string().min(1).required(),
        repo: joi.string().min(1).required(),
    }),
    async isError(schema, data) {
        try {
            // console.log(schema.validateAsync(data));
            await schema.validateAsync(data);
            return false;
        }
        catch ({ details: [error] }) {
            // console.log(err);
            console.log("Error from schema.js", error);
            return error.message;
        }
    }
}