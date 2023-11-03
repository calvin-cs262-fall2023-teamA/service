--
-- This SQL script builds a database for lost and found app, deleting any pre-existing version.
--

-- Drop previous versions of the tables if they they exist, in reverse order of foreign keys.
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Item;

-- Create the schema.

-- User is a reserved word, so we need to use double quotations around it "User"
CREATE TABLE Users (
	ID SERIAL PRIMARY KEY, 
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
    lostFound varchar(50), -- Post is a Lost or Found Item
	--if both postUser and claimUser are filled (not null), it is "claimed" and should be removed from general search results
	postUser varchar(50), --a name (Users.name) of a user. "owner/finder"
	claimUser varchar(50) --a name (Users.name) of a user. "owner/finder"
	--image BLOB, --should be an expo-image-picker ImagePickerResult type
	);





-- Allow users to select data from the tables.
GRANT SELECT ON Users TO PUBLIC;
GRANT SELECT ON Item TO PUBLIC;

-- Add sample records.
-- The sample records are not manually added to the database as it has been implemented in the app.

-- INSERT INTO Users VALUES (1, 'admin@calvin.edu', 'Admin', 'password', 'Admin');
-- INSERT INTO Users VALUES (2, 'aj37@calvin.edu', 'Aishwarya Joshi', 'password', 'Standard');

-- INSERT INTO Item(ID, name, description, category, location, status) VALUES (1, 'Bottle', 'A blue 700ml bottle.', 'personal item', 'north hall', 'not claimed');
-- INSERT INTO Item VALUES (2, 'Socks', 'A calvin sock.', 'personal item', 'north hall', 'not claimed');
-- INSERT INTO Item VALUES (3, 'Book', 'Advanced Networking Book', 'personal item', 'north hall', 'not claimed');
