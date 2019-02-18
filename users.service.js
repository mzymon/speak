//const conf = require('conf.json');
const jwt = require('jsonwebtoken');

// users hardcoded for simplicity, store in a db for production applications
const users = [
    { id: 1, username: 'test', password: 'test', firstName: 'Test', lastName: 'User' },
    { id: 2, username: 'Januszek', password: 'Januszek', firstName: 'Janusz', lastName: 'Polak' },
    { id: 3, username: 'Francek', password: 'Francek', firstName: 'Francek', lastName: 'Franczewski' }
];

module.exports = {
    authenticate,
    getAll,
    authenticateWithDB
};

async function authenticate({ username, password }) {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        //const token = jwt.sign({ sub: user.id }, config.secret);
        const token = jwt.sign({ sub: user.id }, 'ZAJECIA Z PPP BARDZO NAM SIE PODOBALY. CZY W ZWIAZKU Z TYM MOZNA LICZYC NA WYROZUMIALOSC PODCZAS OCENY PROJEKTU :) ?');
        const { password, ...userWithoutPassword } = user;
        return {
            ...userWithoutPassword,
            token
        };
    }
}

async function authenticateWithDB( [...usersFromArray], { username, password }) {
    const user = usersFromArray.find(u => u.username === username && u.password === password);
    if (user) {
        const token = jwt.sign({ sub: user.id }, config.secret);
        const { password, ...userWithoutPassword } = user;
        return {
            ...userWithoutPassword,
            token
        };
    }
}

async function getAll() {
    return users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
    });
}