const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userQueries = require('../queries/users.queries');
//const sessionQueries = require('../queries/sessions.queries');

const config = require('../config/config');

async function register({ name, phone, password, ip, userAgent }) {
    const Password_hash = await bcrypt.hash(password, 10);

    const user = await userQueries.createUser(
        name,
        phone,
        Password_hash,
    );
    return user;
}

module.exports = {
    register
};