# service

This is the data service application for the [CalvinFinds project](https://github.com/calvin-cs262-fall2023-teamA/project), which is deployed here:

[http://calvinfinds.azurewebsites.net/](http://calvinfinds.azurewebsites.net/)
It has the following data route URLs:   

/ a hello message  
/users a list of users   
/users/:id a single user with the given ID   
/items a list of items   
/items/:id a single item with the given ID   
It is based on the standard Azure App Service tutorial for Node.js.   

The database is relational with the schema specified in the sql/ sub-directory and is hosted on [ElephantSQL](https://customer.elephantsql.com/instance). The database server, user and password are stored as Azure application settings so that they aren’t exposed in this (public) repo.
