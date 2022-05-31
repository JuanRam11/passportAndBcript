# passport

##To test this app

First you need MySQL or PostgreSQL database intall on your system, then you need to run
npm install on a terminal to install all project dependencies.

After that you need to change the query string or conection string for the one you use on your database
if you using PostgreSQL is something like this:

postgres://YOUUSESRNAME:YOURPASSWORD@127.0.0.1:5432/YOURDATABASE
replace with your username, password and database.

then go to line 8 in index.js and replace with your connection string

then you have to run the project using node or nodemon index.js, after the server is up and running you have to git http://localhost:3000/sync
for the code to create the database with all columns that are necesary, after that you can try to go to http://localhost:3000/secret and is
goint to take you to http://localhost:3000/login because secret route is a protected route, then you can hit the register page to register with any username and password
then you can go to login and try to login with the user created, then you can hit the secret route without problem and logout from that route.
