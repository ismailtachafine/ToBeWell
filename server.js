const express = require('express')
const path = require("path");
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});
const { v4: uuidV4 } = require('uuid')

const bcrypt = require("bcrypt");
const collection = require("./config");

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs')

app.use(express.static('public'))

app.get("/create", (req, res) => {
  res.redirect(`/create_room/${uuidV4()}`)
})

app.get('/create_room/:new_room', (req, res) => {
  res.render('new_room', { roomId: req.params.new_room });
});

app.get('/rooms/:room', (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// @route
app.get('/home', (req, res) => {
  res.render("home");
});

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-connected', userId);
    // messages
    socket.on('message', (message) => {
      //send message to the same room
      io.to(roomId).emit('createMessage', message)
  }); 

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId);
    })
  })
})


// Convert data into json format
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.get("/", (req, res) => {
  res.render("welcome");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/login", (req, res) => {
  res.render("login");
});

// Register User
app.post("/signup", async (req, res) => {
  const data = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: req.body.password,
      confpassword: req.body.confpassword
  }

  // Check if the user already exists in the database
  const existinguser = await collection.findOne({email: data.email});
  if (existinguser) {
      // res.send("Email already exists. Please choose a different email.");
      res.render("signup", { error: "Email already exists. Please choose a different email." });
  }if (data.password != data.confpassword){
      res.render("signup", { error: "The passwords don't match." });
  }else {    
      // Hash the password using bcrypt
      const saltRounds = 10; // Number of salt rounds for bcrypt
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);
      data.password = hashedPassword; // Replace the original password with the hashed one

      // const userdata = await collection.insertMany(data);
      // res.redirect("/login");
      // console.log(userdata);

      const newUser = new collection(data);
      await newUser.save();
      res.redirect("/login");
  }
});

// Login user 
app.post("/login", async (req, res) => {
  try {
      const check = await collection.findOne({ email: req.body.email });
      if (!check) {
          // res.send("Email cannot be found")
          res.render("login", { error: "Email cannot be found" });
      }
      // Compare the hashed password from the database with the plaintext password
      const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
      if (!isPasswordMatch) {
          // res.send("Wrong Password");
          res.render("login", { error: "Wrong Password" });
      }
      else {
          res.redirect("/home");
          res.render("home", { firstname: check.firstname, lastname: check.lastname });
      }
  }
  catch {
      // res.send("Wrong Details");
      res.render("login", { error: "Wrong Details" });
  }
});

app.get("/home", async (req, res) => {
  try {
    const user = await collection.findOne({ /* Add the condition to match the user */ });
    if (!user) {
      // Handle the case when the user is not found
      res.render("login", { error: "User not found" });
    }

    res.render("home", { firstname: user.firstname, lastname: user.lastname });
  } catch (error) {
    // Handle any error that occurs during the database query
    console.error(error);
    res.render("error", { message: "An error occurred" });
  }
});

const port = 3000;
server.listen(process.env.PORT||port, () => {
  console.log(`Server running on Port: ${port}`);
})

