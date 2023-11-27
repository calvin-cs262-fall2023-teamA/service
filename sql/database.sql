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
    --if both postUser and claimUser are filled (not null), it is "claimed" and should be removed from general search results
	datePosted varchar(50), -- format MM/DD/YYYY
    postUser integer, -- an id of a user. "owner/finder"
	claimUser integer, -- an id of a user. "owner/finder"
    archived BOOLEAN, -- for removing listings from search results
	itemImage text -- for storing binary data of an image
	--image bytea, --should just be a uri that can be used in an expo image component. images should not be stored directly in this table. make a new table or reference a file.
);

CREATE TABLE Comment (
    userID SERIAL REFERENCES Users(ID),
    itemID SERIAL REFERENCES Item(ID),
    content varchar(50)
);

-- CREATE TABLE Image (
--     referenceID SERIAL, -- references either user or item, depending on what the image is for
--     imageType varchar(5), -- 'user' or 'item'
--     image bytea -- binary image data
-- );

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
