--
-- This SQL script builds a database for lost and found app, deleting any pre-existing version.
--

-- Drop previous versions of the tables if they they exist, in reverse order of foreign keys.
DROP TABLE IF EXISTS Comment;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Item;

-- Create the schema.

-- User is a reserved word, so we need to use double quotations around it "User"
CREATE TABLE Users (
	ID SERIAL PRIMARY KEY, 
	emailAddress varchar(50) NOT NULL,
	name varchar(50),
    -- password varchar(60), --"...the length of generated hashes is 60 characters." (https://www.npmjs.com/package/react-native-bcrypt)
    password varchar(100),
    type varchar(50),
    profileImage varchar(250), -- for storing uri of image. replaced by imageContainer/Blob, (currently) kept for support of old code
    imageContainer varchar(36), -- a uuid, always 36 characters. Used to locate images in the storage account.
    imageBlob varchar(40) -- a uuid, always 36 characters. Used to locate images in the storage account. Extra space for file extensions (.txt).
);

CREATE TABLE Item (
	ID SERIAL PRIMARY KEY,
    title varchar(50), --changed from name to title so that it doesn't overlap with users (for join requests)
    description varchar(50),
    category varchar(50),
    location varchar(50),
    lostFound varchar(50), -- Post is a Lost or Found Item
	datePosted varchar(50), -- format MM/DD/YYYY
    postUser integer, -- an id of a user. "owner/finder"
	claimUser integer, -- an id of a user. "owner/finder" CURRENTLY UNUSED but remains in db for future development.
    archived BOOLEAN, -- for removing listings from search results
	itemImage text, -- for storing uri of image. replaced by imageContainer/Blob, (currently) kept for support of old code
    imageContainer varchar(36), -- a uuid, always 36 characters. Used to locate images in the storage account.
    imageBlob varchar(40) -- a uuid, always 36 characters. Used to locate images in the storage account. Extra space for file extensions (.txt).
);

CREATE TABLE Comment (
    userID SERIAL REFERENCES Users(ID),
    itemID SERIAL REFERENCES Item(ID),
    content varchar(50)
);

-- Allow users to select data from the tables.
GRANT SELECT ON Comment TO PUBLIC;
GRANT SELECT ON Users TO PUBLIC;
GRANT SELECT ON Item TO PUBLIC;

-- Add sample records.
-- The sample records are not manually added to the database as it has been implemented in the app.

-- INSERT INTO Users VALUES (1, 'admin@calvin.edu', 'Admin', 'password', 'Admin');
-- INSERT INTO Users VALUES (2, 'aj37@calvin.edu', 'Aishwarya Joshi', 'password', 'Standard');

-- INSERT INTO Item(ID, name, description, category, location, status) VALUES (1, 'Bottle', 'A blue 700ml bottle.', 'personal item', 'north hall', 'not claimed');
-- INSERT INTO Item VALUES (2, 'Socks', 'A calvin sock.', 'personal item', 'north hall', 'not claimed');
-- INSERT INTO Item VALUES (3, 'Book', 'Advanced Networking Book', 'personal item', 'north hall', 'not claimed');

-- sample "items"
-- INSERT INTO Item (title, description, category, location, lostfound, datePosted, postUser, claimUser, archived, imageContainer, imageBlob) VALUES ('Charger', 'Laptop charger', 'electronics', 'Commons', 'found', '11/6/2023', 2, null, FALSE, 'demo', 'charger.txt');
-- INSERT INTO Item (title, description, category, location, lostfound, datePosted, postUser, claimUser, archived, imageContainer, imageBlob) VALUES ('Water Bottle', 'A green waterbottle', 'items', 'N/A', 'lost', '11/7/2023', 8, 4, FALSE, 'demo', 'bottle.txt');
-- INSERT INTO Item (title, description, category, location, lostfound, datePosted, postUser, claimUser, archived, imageContainer, imageBlob) VALUES ('Notebook', '', 'items', 'N/A', 'lost', '11/4/2023', 2, 5, TRUE, 'demo', 'notebook.txt');
-- INSERT INTO Item (title, description, category, location, lostfound, datePosted, postUser, claimUser, archived, imageContainer, imageBlob) VALUES ('Sock', 'I lost it in Vanderlinden''s office', 'clothing', 'Science Building', 'lost', '11/3/2023', 5, null, FALSE, null, null);
-- INSERT INTO Item (title, description, category, location, lostfound, datePosted, postUser, claimUser, archived, imageContainer, imageBlob) VALUES ('Textbook', 'Computer Organization and Architecture', 'books', 'North Hall', 'found', '11/3/2023', 2, null, FALSE, 'demo', 'texbook.txt');
-- INSERT INTO Item (title, description, category, location, lostfound, datePosted, postUser, claimUser, archived, imageContainer, imageBlob) VALUES ('Umbrella', 'A black umbrella', 'items', 'North Hall', 'found', '11/4/2023', 2, 3, FALSE, 'demo', 'umbrella.txt');
-- INSERT INTO Item (title, description, category, location, lostfound, datePosted, postUser, claimUser, archived, imageContainer, imageBlob) VALUES ('Hat', '', 'clothing', 'N/A', 'lost', '11/3/2023', 3, 4, FALSE, 'demo', 'hat.txt');
-- INSERT INTO Item (title, description, category, location, lostfound, datePosted, postUser, claimUser, archived, imageContainer, imageBlob) VALUES ('Can', 'Description of can', 'items', 'N/A', 'found', '11/2/2023', 8, 4, FALSE, 'demo', 'can.txt');
-- INSERT INTO Item (title, description, category, location, lostfound, datePosted, postUser, claimUser, archived, imageContainer, imageBlob) VALUES ('Phone', 'iPhone 13', 'clothing', 'N/A', 'lost', '11/5/2023', 2, null, TRUE, 'demo', 'phone.txt');
-- INSERT INTO Item (title, description, category, location, lostfound, datePosted, postUser, claimUser, archived, imageContainer, imageBlob) VALUES ('Car Keys', 'Subaru Car Keys', 'keys', 'N/A', 'lost', '11/3/2023', 3, 4, FALSE, 'demo', 'keys.txt');
-- INSERT INTO Item (title, description, category, location, lostfound, datePosted, postUser, claimUser, archived, imageContainer, imageBlob) VALUES ('Gloves', '', 'clothing', 'N/A', 'lost', '11/1/2023', 2, 5, FALSE, 'demo', 'gloves.txt');
-- INSERT INTO Item (title, description, category, location, lostfound, datePosted, postUser, claimUser, archived, imageContainer, imageBlob) VALUES ('Water bottle', 'Test', 'items', 'Science Building',	'found', '11/10/2023', 2, null, FALSE, 'demo', 'demobottle.txt');

