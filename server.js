// Set up the database connection.

const pgp = require('pg-promise')();
const db = pgp({
    host: 'peanut.db.elephantsql.com',
    port: 5432,
    database: 'nzykzast',
    user: 'nzykzast',
    password: 'PWMqmS1q0X0Q7ZfPZg-o3kODB6yDDu5x'
});

// Configure the server and its routes.

const express = require('express');
const app = express();
const port = 5432;
const router = express.Router();
router.use(express.json());

router.get("/", readHelloMessage);
router.get("/users", readUsers);
router.get("/users/:id", readUser);
router.put("/users/:id", updateUser);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);
router.post('/item', createItem);

app.use(router);
app.listen(port, () => console.log(`Listening on port ${port}`));

// Implement the CRUD operations.

function returnDataOr404(res, data) {
    if (data == null) {
        res.sendStatus(404);
    } else {
        res.send(data);
    }
}

function readHelloMessage(req, res) {
    res.send('Hello, People service!');
}

 function readUsers(req, res, next) {
    db.many("SELECT * FROM Users")
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            next(err);
        })
}

function readUser(req, res, next) {
    db.oneOrNone('SELECT * FROM Users WHERE id=${id}', req.params)
        .then(data => {
            returnDataOr404(res, data);
        })
        .catch(err => {
            next(err);
        });
}

function updateUser(req, res, next) {
    db.oneOrNone('UPDATE Users SET email=${body.email}, name=${body.name} WHERE id=${params.id} RETURNING id', req)
        .then(data => {
            returnDataOr404(res, data);
        })
        .catch(err => {
            next(err);
        });
}

function createUser(req, res, next) {
    db.one('INSERT INTO Users(email, name) VALUES (${email}, ${name}) RETURNING id', req.body)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            next(err);
        });
}

function deleteUser(req, res, next) {
    db.oneOrNone('DELETE FROM Users WHERE id=${id} RETURNING id', req.params)
        .then(data => {
            returnDataOr404(res, data);
        })
        .catch(err => {
            next(err);
        });
}

function createItem(req, res, next) {
    db.one('INSERT INTO Item VALUES (${name}, ${description}, ${category}, ${location}, ${status})', req.body) //add image later as well
    .then(data => {
        res.send(data);
    })
    .catch(err => {
        next(err);
    });
}
