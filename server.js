/* eslint-disable linebreak-style */
/* eslint-disable no-use-before-define */
/* eslint-disable prefer-destructuring */
/* eslint-disable prefer-template */
/* eslint-disable no-template-curly-in-string */
/* eslint-disable no-plusplus */

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

// Set up the database connection.

/**
 * This module implements a REST-inspired webservice for the CalvinFinds DB.
 * The database is hosted on ElephantSQL.
 *
 * To guard against SQL injection attacks, this code uses pg-promise's built-in
 * variable escaping. This prevents a client from issuing this URL:
 *     https://calvinfinds.azurewebsites.net//comments/1%3BDELETE%20FROM%20Comment
 * which would delete records in the PlayerGame and then the Player tables.
 * In particular, we don't use JS template strings because it doesn't filter
 * client-supplied values properly.
 * TODO: Consider using Prepared Statements.
 *      https://vitaly-t.github.io/pg-promise/PreparedStatement.html
 *
 * This service assumes that the database connection strings and the server mode are
 * set in environment variables. See the DB_* variables used by pg-promise. And
 * setting NODE_ENV to production will cause ExpressJS to serve up uninformative
 * server error responses for all errors.
 *
 * @author: CalvinFinds Team
 * @date: Fall, 2023
 */

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
router.post('/items/archive/:id', archiveItem);

// profile page
router.get('/items/post/:postUser', readPostedItems); // posted items
router.get('/items/archived/:postuser', readArchivedItems); // claimed items
router.post('/users/image', updateUserImage); // put wasn't working, upload profile image
// profile, main, and comments pages
router.get('/users/image/:id', readUserImage); // download profile image

// search
/* search term in url (text), lost/found filter (filter), the logged in user (for posted/archived)
and whether the search should be for all items, posted items, or archived items */
router.get('/items/search/:text/:postUser/:route', searchItems);

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

async function updateUserImage(req, res, next) {
  // body includes userID and image data (uri)
  /* upload new image data. */
  const imagePath = (req.body.imagedata) ? await uploadImage(req.body.imagedata) : [null, null];

  /* Send route to image data to the database */
  db.oneOrNone('UPDATE Users SET imagecontainer = \'' + imagePath[0] + '\', imageblob = \'' + imagePath[1] + '\' WHERE id = ${id}', req.body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}

function readUserImage(req, res, next) {
  db.oneOrNone('SELECT Users.imagecontainer, Users.imageblob FROM Users WHERE id=${id}', req.params)
    .then(async (data) => {
      const returnData = data; // work around eslint rule
      if (data.imageblob !== 'null' && data.imageblob !== null) {
        returnData.userimage = await downloadImage(
          returnData.imagecontainer,
          returnData.imageblob,
        );
      }
      returnDataOr404(res, returnData);
    })
    .catch((err) => {
      next(err);
    });
}

async function createItems(req, res, next) {
  // if image isn't null, upload its data
  const imagePath = (req.body.imagedata) ? await uploadImage(req.body.imagedata) : [null, null];
  // TODO: fix formatting of this query
  db.one('INSERT INTO Item (title, description, category, location, lostFound, datePosted, postUser, claimUser, archived, itemImage, imageContainer, imageBlob) VALUES (${title}, ${description}, ${category}, ${location}, ${lostFound}, ${datePosted}, ${postUser}, ${claimUser}, ${archived}, \'../../assets/placeholder.jpg\', \'' + imagePath[0] + '\', \'' + imagePath[1] + '\')', req.body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}

async function readItems(req, res, next) {
  db.many('SELECT Item.*, Users.name, Users.profileimage, Users.emailaddress, Users.imagecontainer AS usercontainer, Users.imageblob AS userblob FROM Item, Users WHERE Users.id=postuser AND archived=FALSE ORDER BY Item.id ASC')
    .then(async (data) => {
      const returnData = data; // work around eslint rule
      for (let i = 0; i < returnData.length; i++) {
        // TODO: currently a string 'null' b/c of how create query is written
        if (returnData[i].imageblob !== 'null' && returnData[i].imageblob !== null) {
          /* await in loop: inefficient, but does need to be
           done for every item (that has an image loaded). */
          // eslint-disable-next-line no-await-in-loop
          returnData[i].itemimage = await downloadImage(
            returnData[i].imagecontainer,
            returnData[i].imageblob,
          );
        }
        if (returnData[i].userblob !== 'null' && returnData[i].userblob !== null) {
          /* await in loop: inefficient, but does need to be
           done for every item (that has an image loaded). */
          // eslint-disable-next-line no-await-in-loop
          returnData[i].profileimage = await downloadImage(
            returnData[i].usercontainer,
            returnData[i].userblob,
          );
        }
      }
      returnDataOr404(res, returnData);
    })
    .catch((err) => {
      next(err);
    });
}

/**
 * Sends a GET request to the database.
 * Return values are based on the input parameters (in url, req.params).
 * Most notably, __req.params.text__ holds the user's search input.
 * This search input is parsed and an sql query is dynamically built
 * based on that data along with the other input parameters:
 * - __req.params.postuser__ = Which user is making this request.
 *  Used in posted/archived item searches.
 * - __req.params.route__ = Stores whether the user is searching
 *  through posted, archived, or all items.
 */
function searchItems(req, res, next) {
  const MINIMUMWORDLENGTH = 4; // minimum length of words included as search terms in the sql query
  let searchString = '';
  const searchArray = (req.params.text).split(' ');
  for (let i = 0; i < searchArray.length; i++) {
    // if only one search term, search regardless of length
    if (searchArray[i].length >= MINIMUMWORDLENGTH || searchArray.length === 1) {
      // if it is a significant word, add it to the search terms.
      searchString += "LOWER(title) LIKE LOWER('%" + searchArray[i] + "%') OR LOWER(description) LIKE LOWER('%" + searchArray[i] + "%') OR LOWER(location) LIKE LOWER('%" + searchArray[i] + "%')";
      if (i !== searchArray.length - 1) {
        // if the last word is < MINIMUMWORDLENGTH characters, will cause an error.
        searchString += ' OR ';
      }
    }
  }
  if (searchArray[searchArray.length - 1].length < MINIMUMWORDLENGTH && searchArray.length > 1) {
    // if the last word is < MINIMUMWORDLENGTH characters, will cause an error.
    searchString = searchString.slice(0, -3); // remove OR to fix the error
  }
  let searchRoute = ' AND archived=FALSE'; // default, searching through all items
  if (req.params.route === 'post') {
    searchRoute = ' AND postUser=' + req.params.postUser + ' AND archived=FALSE';
  } else if (req.params.route === 'archived') {
    searchRoute = ' AND postUser=' + req.params.postUser + ' AND archived=TRUE';
  }
  db.many('SELECT Item.*, Users.name, Users.profileimage, Users.emailaddress, Users.imagecontainer AS userContainer, Users.imageblob AS userBlob FROM Item, Users WHERE Users.id=postuser AND (' + searchString + ')' + searchRoute + ' ORDER BY Item.id ASC')
    .then(async (data) => {
      const returnData = data; // work around eslint rule
      for (let i = 0; i < returnData.length; i++) {
        // TODO: currently a string 'null' b/c of how create query is written
        if (returnData[i].imageblob !== 'null' && returnData[i].imageblob !== null) {
          /* await in loop: inefficient, but does need to be
           done for every item (that has an image loaded). */
          // eslint-disable-next-line no-await-in-loop
          returnData[i].itemimage = await downloadImage(
            returnData[i].imagecontainer,
            returnData[i].imageblob,
          );
        }
        if (returnData[i].userblob !== 'null' && returnData[i].userblob !== null) {
          /* await in loop: inefficient, but does need to be
           done for every item (that has an image loaded). */
          // eslint-disable-next-line no-await-in-loop
          returnData[i].profileimage = await downloadImage(
            returnData[i].usercontainer,
            returnData[i].userblob,
          );
        }
      }
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

function readPostedItems(req, res, next) {
  db.many("SELECT Item.*, Users.name, Users.profileimage, Users.emailaddress, Users.imagecontainer AS userContainer, Users.imageblob AS userBlob FROM Item, Users WHERE Users.id=postuser AND postUser='" + req.params.postUser + "' AND archived=FALSE ORDER BY Item.id ASC", req.params) // should not return values where item.claimuser = item.postuser (indicates a deleted item.)
    .then(async (data) => {
      const returnData = data; // work around eslint rule
      for (let i = 0; i < returnData.length; i++) {
        // TODO: currently a string 'null' b/c of how create query is written
        if (returnData[i].imageblob !== 'null' && returnData[i].imageblob !== null) {
          /* await in loop: inefficient, but does need to be
           done for every item (that has an image loaded). */
          // eslint-disable-next-line no-await-in-loop
          returnData[i].itemimage = await downloadImage(
            returnData[i].imagecontainer,
            returnData[i].imageblob,
          );
        }
        if (returnData[i].userblob !== 'null' && returnData[i].userblob !== null) {
          /* await in loop: inefficient, but does need to be
           done for every item (that has an image loaded). */
          // eslint-disable-next-line no-await-in-loop
          returnData[i].profileimage = await downloadImage(
            returnData[i].usercontainer,
            returnData[i].userblob,
          );
        }
      }
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

function readArchivedItems(req, res, next) {
  db.many("SELECT Item.*, Users.name, Users.profileimage, Users.emailaddress, Users.imagecontainer AS userContainer, Users.imageblob AS userBlob FROM Item, Users WHERE Users.id=postuser AND postUser='" + req.params.postuser + "' AND archived=TRUE ORDER BY Item.id ASC", req.params) // returns archived items, not claimed. will refactor later.
    .then(async (data) => {
      const returnData = data; // work around eslint rule
      for (let i = 0; i < returnData.length; i++) {
        // TODO: currently a string 'null' b/c of how create query is written
        if (returnData[i].imageblob !== 'null' && returnData[i].imageblob !== null) {
          /* await in loop: inefficient, but does need to be
           done for every item (that has an image loaded). */
          // eslint-disable-next-line no-await-in-loop
          returnData[i].itemimage = await downloadImage(
            returnData[i].imagecontainer,
            returnData[i].imageblob,
          );
        }
        if (returnData[i].userblob !== 'null' && returnData[i].userblob !== null) {
          /* await in loop: inefficient, but does need to be
           done for every item (that has an image loaded). */
          // eslint-disable-next-line no-await-in-loop
          returnData[i].profileimage = await downloadImage(
            returnData[i].usercontainer,
            returnData[i].userblob,
          );
        }
      }
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

function archiveItem(req, res, next) {
  db.none('UPDATE Item SET archived = true WHERE id=${id}', req.params)
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

/**
 * Returns a set of comments attached to an item.
 * The specific information returned for each comment includes:
 * - The commenting user's username
 * - The commenting user's profile icon (retrieved from storage account)
 * - The contents of the comment itself (text)
 */
function readComments(req, res, next) {
  db.many('SELECT Comment.*, Users.name, Users.profileImage, Users.imagecontainer, Users.imageblob FROM Comment, Users WHERE userID = users.ID AND itemID=${id}', req.params)
    .then(async (data) => {
      const returnData = data; // work around eslint rule
      for (let i = 0; i < returnData.length; i++) {
        if (data[i].imageblob !== 'null' && data[i].imageblob !== null) {
          /* await in loop: inefficient, but does need to be
           done for every comment (that has an image loaded). */
          // eslint-disable-next-line no-await-in-loop
          returnData[i].userimage = await downloadImage(
            returnData[i].imagecontainer,
            returnData[i].imageblob,
          );
        }
      }
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

// Interact with storage account
/* a large amount of the code for the storage account interaction is taken from a tutorial,
  https://learn.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-nodejs */

/**
 * Creates a container and blob in the storage account
 * @param {*} data byte64 data that should be received from the client
 * @returns an array containing values that refer to a blob in the storage account.
 * - Return includes the values needed to make a blockBlobClient for downloading images.
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
  return [containerName, blobName]; // the building blocks of a blockBlobClient.
  // returning strings that can be easily put in a database.
}

/**
 * Allows the user to download an image from the storage account at a particular location.
 * @param {*} blockBlobClient the upload location/url. Should be the same one used in uploadImage.
 * @returns byte64 image data to be sent to the client
 */
async function downloadImage(containerName, blobName) {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
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
