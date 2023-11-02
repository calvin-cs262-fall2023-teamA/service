// Set up the database connection.

const pgp = require('pg-promise')();

const db = pgp({
    host: process.env.DB_SERVER,
    port: process.env.DB_PORT,
    database: process.env.DB_USER,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Configure the server and its routes.

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();
router.use(express.json());

router.get("/", readHelloMessage);
router.get("/users", readUsers);
router.get("/item", readItem);
router.get("/users/:id", readUser);
router.put("/users/:id", updateUser);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);
router.post('/item', createItem);
router.post("/login", handleLogin)

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
    res.send('Welcome to Calvin Finds!');
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
    db.one('INSERT INTO Users(name, emailAddress, password, type) VALUES (${name}, ${email}, ${password}, ${type}) RETURNING id', req.body)
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

function readItems(req, res, next) {
    db.many("SELECT * FROM Item")
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            next(err);
        })
}

function createItems(req, res, next) {
    db.one('INSERT INTO Item VALUES (${name}, ${description}, ${category}, ${location}, ${status})', req.body) //add image later as well
    .then(data => {
        res.send(data);
    })
    .catch(err => {
        next(err);
    });
}

// Implement the user authentication route
async function handleLogin(req, res) {
    const { emailAddress, password } = req.body;
  
    try {
      // Query the database to find the user by email
      const user = await db.oneOrNone('SELECT * FROM Users WHERE emailAddress = $1', emailAddress);
  
      if (!user) {
        // User not found
        return res.status(401).json({ message: 'User not found' });
      }
  
      if (user.password === password) {
        // Password matches, user is authenticated
        return res.status(200).json({ message: 'Login successful' });
      } else {
        // Incorrect password
        return res.status(401).json({ message: 'Incorrect password' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'An error occurred during login' });
    }
  }