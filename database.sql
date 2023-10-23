--
-- This SQL script builds a database for lost and found app, deleting any pre-existing version.
--

-- Drop previous versions of the tables if they they exist, in reverse order of foreign keys.
DROP TABLE IF EXISTS UserItem;
DROP TABLE IF EXISTS "User";
DROP TABLE IF EXISTS Item;

-- Create the schema.

-- User is a reserved word, so we need to use double quotations around it "User"
CREATE TABLE "User" (
	ID integer PRIMARY KEY, 
	emailAddress varchar(50) NOT NULL,
	name varchar(50),
    password varchar(50),
    type varchar(50)
	);

CREATE TABLE Item (
	ID integer PRIMARY KEY,
    name varchar(50),
    description varchar(50),
    category varchar(50),
    location varchar(50),
    status varchar(50)
    --image BLOB
	);

CREATE TABLE UserItem (
	userID integer REFERENCES "User"(ID), 
	itemID integer REFERENCES Item(ID),
    --could be change to another datatype
	ownerfinder varchar(50)
	);



-- Allow users to select data from the tables.
GRANT SELECT ON "User" TO PUBLIC;
GRANT SELECT ON Item TO PUBLIC;
GRANT SELECT ON UserItem TO PUBLIC;

-- Add sample records.
INSERT INTO "User" VALUES (1, 'admin@calvin.edu', 'Admin', 'password', 'Admin');
INSERT INTO "User" VALUES (2, 'aj37@calvin.edu', 'Aishwarya Joshi', 'password', 'Standard');

INSERT INTO Item(ID, name, description, category, location, status) VALUES (1, 'Bottle', 'A blue 700ml bottle.', 'personal item', 'north hall', 'not claimed');
INSERT INTO Item VALUES (2, 'Socks', 'A calvin sock.', 'personal item', 'north hall', 'not claimed');
INSERT INTO Item VALUES (3, 'Book', 'Advanced Networking Book', 'personal item', 'north hall', 'not claimed');

INSERT INTO UserItem VALUES (1, 2, 'finder');
INSERT INTO UserItem VALUES (2, 1, 'owner');