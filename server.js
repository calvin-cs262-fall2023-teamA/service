/* eslint-disable no-use-before-define */
/* eslint-disable prefer-destructuring */
/* eslint-disable prefer-template */
/* eslint-disable no-template-curly-in-string */
// Set up the database connection.

const pgp = require('pg-promise')();

const db = pgp({
  host: process.env.DB_SERVER,
  port: process.env.DB_PORT,
  database: process.env.DB_USER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Configure the server and its routes.

const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();
router.use(express.json());

router.get('/', readHelloMessage);

// user functions
router.get('/users', readUsers);
router.get('/users/:id', readUser);
router.put('/users/:id', updateUser);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);
router.get('/users/email/:email', readUserFromEmail);
// item functions
router.get('/items', readItems);
router.get('/items/:id', readItem);
router.post('/items', createItems);

// login functions
router.post('/login', handleLogin);

// profile page
router.get('/items/post/:postUser', readPostedItems); // posted items
router.get('/items/archived/:postuser', readArchivedItems); // claimed items
router.post('/users/image', updateUserImage);

// search
router.get('/items/search/:title', searchItems); // search term in url

// comments
router.get('/comments', readAllComments);
router.get('/comments/:id', readComments); // id = itemid
router.post('/comments/post', postComment);

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
  db.many('SELECT * FROM Users')
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}

function readUser(req, res, next) {
  db.oneOrNone('SELECT * FROM Users WHERE id=${id}', req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

function readUserFromEmail(req, res, next) {
  db.oneOrNone("SELECT * FROM Users WHERE emailaddress='" + req.params.email + "'", req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

function updateUser(req, res, next) {
  db.oneOrNone('UPDATE Users SET email=${body.email}, name=${body.name} WHERE id=${params.id} RETURNING id', req)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

function createUser(req, res, next) {
  db.one('INSERT INTO Users(name, emailAddress, password, type, profileimage) VALUES (${name}, ${email}, ${password}, ${type}, ${profileimage}) RETURNING id', req.body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}

function deleteUser(req, res, next) {
  db.oneOrNone('DELETE FROM Users WHERE id=${id} RETURNING id', req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

function updateUserImage(req, res, next) {
  db.oneOrNone('UPDATE Users SET profileImage = ${image} WHERE id = ${id}', req.body)
    .then((data) => {
      res.send(data);
    })
    .catch(err => {
      next(err);
    });
}

function readItems(req, res, next) {
  db.many('SELECT Item.*, Users.name, Users.profileimage FROM Item, Users WHERE Users.id=postuser ORDER BY Item.id ASC')
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

function searchItems(req, res, next) {
  db.many("SELECT Item.*, Users.name, Users.profileimage FROM Item, Users WHERE Users.id=postuser AND title LIKE '%" + req.params.title + "%' ORDER BY Item.id ASC", req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

function createItems(req, res, next) {
  db.one('INSERT INTO Item (title, description, category, location, lostFound, datePosted, postUser, claimUser, archived, itemImage) VALUES (${title}, ${description}, ${category}, ${location}, ${lostFound}, ${datePosted}, ${postUser}, ${claimUser}, ${archived}, ${itemImage})', req.body) // add image later as well
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}

function readPostedItems(req, res, next) {
  db.many("SELECT Item.*, Users.name, Users.profileimage FROM Item, Users WHERE Users.id=postuser AND postUser='" + req.params.postUser + "' ORDER BY Item.id ASC", req.params) // should not return values where item.claimuser = item.postuser (indicates a deleted item.)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

function readArchivedItems(req, res, next) {
  db.many("SELECT Item.*, Users.name, Users.profileimage FROM Item, Users WHERE Users.id=postuser AND postUser='" + req.params.postuser + "' AND archived=TRUE ORDER BY Item.id ASC", req.params) // returns archived items, not claimed. will refactor later.
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

function readItem(req, res, next) {
  db.oneOrNone('SELECT * FROM Item WHERE id=${id}', req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

function readAllComments(req, res, next) {
  db.many('SELECT * FROM Comment')
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch(err => {
      next(err);
    });
}

function readComments(req, res, next) {
  db.many('SELECT Comment.*, Users.name, Users.profileImage FROM Comment, Users WHERE userID = users.ID AND itemID=${id}', req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch(err => {
      next(err);
    });
}

function postComment(req, res, next) {
  db.one('INSERT INTO Comment(userID, itemID, content) VALUES (${userID}, ${itemID}, ${content})', req.body)
    .then((data) => {
      returnDataOr404(res, data);
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
    // eslint-disable-next-line no-else-return
    } else {
      // Incorrect password
      return res.status(401).json({ message: 'Incorrect password' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred during login' });
  }
}
