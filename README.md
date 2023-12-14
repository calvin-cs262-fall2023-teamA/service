# service

This is the data service application for the [CalvinFinds project](https://github.com/calvin-cs262-fall2023-teamA/project), which is deployed here:

[http://calvinfinds.azurewebsites.net/](http://calvinfinds.azurewebsites.net/)
It has the following data route URLs:   

|HTTP method| URL | Description|
|-----|-----------|----------------------|
|GET|`/`| a hello message  |
|GET|`/users`| a list of users | 
|GET|`/users/:id`| details about the user with the given 'id' |  
|PUT|`/users/:id`| update the user with the given 'id' |  
|POST|`/users`| create a new user |  
|GET|`/users/:id`| a single user with the given 'id' |   
|GET|`/items`| a list of items |
|GET|`/items/:id`| a single item with the given 'id' |
|POST|`/items`| create a new item |
|GET|`/comments`| a list of comments |
|GET|`/comments/:id`| a single comment with the given 'id' |
|POST|`/comments/post`| post a new comment |




It is based on the standard Azure App Service tutorial for Node.js.   

The database is relational with the schema specified in the sql/ sub-directory and is hosted on [ElephantSQL](https://customer.elephantsql.com/instance). The database server, user and password are stored as Azure application settings so that they aren’t exposed in this (public) repo.

This data service is implemented for the client application [CalvinFinds](https://github.com/calvin-cs262-fall2023-teamA/client).
