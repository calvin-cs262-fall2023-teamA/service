--
-- This SQL script builds a database for lost and found app, deleting any pre-existing version.
--

-- Drop previous versions of the tables if they they exist, in reverse order of foreign keys.
DROP TABLE IF EXISTS Comment;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Item;
DROP TABLE IF EXISTS Image;

-- Create the schema.

-- User is a reserved word, so we need to use double quotations around it "User"
CREATE TABLE Users (
	ID SERIAL PRIMARY KEY, 
	emailAddress varchar(50) NOT NULL,
	name varchar(50),
    password varchar(50),
    type varchar(50),
    profileImage varchar(250) --works the same way as itemImage
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
	itemImage text, -- for storing uri of image. should be removed later.
    imageContainer varchar(36), -- a uuid, always 36 characters. Used to locate images in the storage account.
    imageBlob varchar(36) -- a uuid, always 36 characters. Used to locate images in the storage account.
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
GRANT SELECT ON Image TO PUBLIC;

-- Add sample records.
-- The sample records are not manually added to the database as it has been implemented in the app.

-- INSERT INTO Users VALUES (1, 'admin@calvin.edu', 'Admin', 'password', 'Admin');
-- INSERT INTO Users VALUES (2, 'aj37@calvin.edu', 'Aishwarya Joshi', 'password', 'Standard');

-- INSERT INTO Item(ID, name, description, category, location, status) VALUES (1, 'Bottle', 'A blue 700ml bottle.', 'personal item', 'north hall', 'not claimed');
-- INSERT INTO Item VALUES (2, 'Socks', 'A calvin sock.', 'personal item', 'north hall', 'not claimed');
-- INSERT INTO Item VALUES (3, 'Book', 'Advanced Networking Book', 'personal item', 'north hall', 'not claimed');
