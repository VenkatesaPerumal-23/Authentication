const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// register new user api
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userGetQuery = `
    SELECT * FROM
    user
    WHERE
    username = '${username}';`;

  const userDetails = await db.get(userGetQuery);
  if (userDetails === undefined) {
    const insertUser = `
        INSERT INTO user(username,name,password,gender,location)
        VALUES (
            '${username}','${name}','${hashedPassword}','${gender}','${location}'
        );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(insertUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// login user api
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserName = `
    SELECT * FROM
    user 
    WHERE
    username = '${username}';`;

  const userNameDetails = await db.get(getUserName);
  if (userNameDetails === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordMatch = await bcrypt.compare(
      password,
      userNameDetails.password
    );
    if (passwordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// change password of a user api 
app.put("/change-password",(request,response)=>{
    const{ username, oldPassword, newPassword } = request.body;
    const getUserName = `
    SELECT * FROM
    user 
    WHERE
    username = '${username}';`;

    const userNameDetails = await db.get(getUserName);
    const checkPassword = await bcrypt.compare(oldPassword,userNameDetails.password);
    if(newPassword.length<5){
        response.status(400);
        response.send("Password is too short");
    }

    const hashed = await bcrypt.hash(newPassword,10);
    
    if(checkPassword===true){
    const updatePassword = `
    UPDATE  user
    SET 
    password = '${hashed}'
    WHERE
    username = '${username}';`; 
    await db.run(updatePassword);
    response.status(400);
    response.send("Password updated");
    }
    else{
        response.status(400);
        response.send("Invalid current password");
    }
});

module.exports = app;