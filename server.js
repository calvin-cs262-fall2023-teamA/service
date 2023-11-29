/* eslint-disable no-plusplus */
/* eslint-disable linebreak-style */
/* eslint-disable no-use-before-define */
/* eslint-disable prefer-destructuring */
/* eslint-disable prefer-template */
/* eslint-disable no-template-curly-in-string */

// Blob Storage Account Authentication
// eslint-disable-next-line import/no-extraneous-dependencies
const { BlobServiceClient } = require('@azure/storage-blob');
// eslint-disable-next-line import/no-extraneous-dependencies
const { DefaultAzureCredential } = require('@azure/identity');
// eslint-disable-next-line import/no-extraneous-dependencies
const { v1: uuidv1 } = require('uuid');

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
if (!accountName) throw Error('Azure Storage accountName not found');

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  new DefaultAzureCredential(),
);

let downloadFlag = false;

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

// eslint-disable-next-line import/first, import/order
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();
router.use(express.json({ limit: '50mb' })); // lower this later

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
    .catch((err) => {
      next(err);
    });
}

function readItems(req, res, next) {
  db.many('SELECT Item.*, Users.name, Users.profileimage FROM Item, Users WHERE Users.id=postuser ORDER BY Item.id ASC')
    .then((data) => {
      const returnData = data; // work around eslint rule
      for (let i = 0; i < returnData.length; i++) {
        if (returnData[i].id === 48) { // TODO hardcoded for now
          // change if to IF there is a container and blob name recorded.
          // below, change to fields from returnData[i]
          returnData[i].itemimage = downloadImage('placeholder', 'placeholder');
        }
      }
      
      returnDataOr404(res, returnData);
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
  const blockBlobClient = '../../assets/placeholder.jpg';
  if (req.body.imagedata) uploadImage(req.body.imagedata); // if image isn't null, upload its data
  db.one('INSERT INTO Item (title, description, category, location, lostFound, datePosted, postUser, claimUser, archived, itemImage) VALUES (${title}, ${description}, ${category}, ${location}, ${lostFound}, ${datePosted}, ${postUser}, ${claimUser}, ${archived}, \'' + blockBlobClient + '\')', req.body)
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
    .catch((err) => {
      next(err);
    });
}

function readComments(req, res, next) {
  db.many('SELECT Comment.*, Users.name, Users.profileImage FROM Comment, Users WHERE userID = users.ID AND itemID=${id}', req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

function postComment(req, res, next) {
  db.one('INSERT INTO Comment(userID, itemID, content) VALUES (${userID}, ${itemID}, ${content})', req.body)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
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

// Interact with storage account
/* a large amount of the code for the storage account interaction is taken from a tutorial,
  https://learn.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-nodejs */

/**
 * Creates a container and blob in the storage account
 * @param {*} data byte64 data that should be received from the client
 * @returns an array containing values that refer to a blob in the storage account.
 * - Return is the values needed to make a blockBlobClient for downloading.
 */
async function uploadImage(data) {
  const containerName = uuidv1();
  // Get a reference to a container
  const containerClient = blobServiceClient.getContainerClient(containerName);
  // Create the container
  await containerClient.create();

  // Create a unique name for the blob
  const blobName = uuidv1() + '.txt';

  // Get a block blob client
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(data, data.length);
  // return [containerName, blobName]; // the building blocks of a blockBlobClient.
  // returning strings that can be easily put in a database.
}

/**
 * Allows the user to download an image from the storage account at a particular location.
 * @param {*} blockBlobClient the upload location/url. Should be the same one used in uploadImage.
 * @returns byte64 image data to be sent to the client
 */
async function downloadImage(containerName, blobName) {
  try {
    // constants for now to test for a particular image.
    const containerClient = blobServiceClient.getContainerClient('3d084c70-8e61-11ee-9d07-792054ad2936');
    const blockBlobClient = containerClient.getBlockBlobClient('3db52e40-8e61-11ee-9d07-792054ad2936.txt');
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    return await streamToText(downloadBlockBlobResponse.readableStreamBody);
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Convert stream to text
// taken from storage account tutorial (https://learn.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-nodejs?tabs=managed-identity%2Croles-azure-portal%2Csign-in-azure-cli)
async function streamToText(readable) {
  readable.setEncoding('utf8');
  let data = '';
  // disable for now.
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of readable) {
    data += chunk;
  }
  return data;
}
