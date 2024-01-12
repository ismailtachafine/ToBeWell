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

const session = require('express-session');

const fileUpload = require('express-fileupload');

// Use fileUpload middleware
app.use(fileUpload());


app.use(session({
  secret: '0007',
  resave: false,
  saveUninitialized: true
}));

io.on('connection', socket => {
  socket.on('createMessage', (firstname, lastname, message) => {
    // Process the message and emit it back to the clients
    io.emit('newMessage', { firstname, lastname, message });
  });
});

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs')

app.use(express.static('public'))

app.get("/create", (req, res) => {
  res.redirect(`/create_room/${uuidV4()}`)
})

app.get('/create_room/:new_room', (req, res) => {
  res.render('new_room', { roomId: req.params.new_room });
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

      const newUser = new collection(data);
      await newUser.save();
      res.redirect("/login");
  }
});

// Login user 
// Login user 
app.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({ email: req.body.email });
    if (!check) {
      res.render("login", { error: "Email cannot be found" });
    }

    const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
    if (!isPasswordMatch) {
      res.render("login", { error: "Wrong Password" });
    } else {
      // Store the user's email in the session
      req.session.email = check.email;
      res.redirect("/home");
    }
  } catch {
    res.render("login", { error: "Wrong Details" });
  }
});

app.get("/home", async (req, res) => {
  try {
    const user = await collection.findOne({ email: req.session.email });
    if (!user) {
      res.render("login", { error: "User not found" });
    } else {
      res.render("home", { firstname: user.firstname, lastname: user.lastname });
    }
  } catch (error) {
    console.error(error);
    res.render("error", { message: "An error occurred" });
  }
});

// app.get('/rooms/:room', (req, res) => {
//   const firstname = req.session.firstname;
//   const lastname = req.session.lastname;
//   console.log(firstname, lastname);
//   res.render("room", { roomId: req.params.room, firstname, lastname });
// });

app.get('/rooms/:room', (req, res) => {
  const email = req.session.email;
  collection.findOne({ email }) // Assuming you have access to the MongoDB collection
    .then(user => {
      const firstname = user.firstname; // Assuming you have a "firstname" field in your user document
      const lastname = user.lastname; // Assuming you have a "lastname" field in your user document
      console.log(firstname, lastname);
      res.render("room", { roomId: req.params.room, firstname, lastname });
    })
    .catch(error => {
      console.log(error);
      res.redirect("/login"); // Redirect to the login page if there's an error or user not found
    });
});

// // Add this route in your existing server code
// app.get('/prediction', (req, res) => {
//   res.render('prediction');
// });

// const axios = require('axios');
// const FormData = require('form-data');

// app.post('/upload_predict', async (req, res) => {
//   try {
//     // Check if the request contains files
//     if (!req.files || Object.keys(req.files).length === 0) {
//       return res.status(400).send('No files were uploaded.');
//     }

//     // Get the video file from the request
//     const videoFile = req.files.video;

//     // Create FormData and append the video file
//     const formData = new FormData();
//     formData.append('video', videoFile.data, { filename: videoFile.name });

//     // Send video to Python server for emotion analysis
//     const pythonServerUrl = 'http://localhost:5000'; // Replace with the actual URL of your Python server
//     const response = await axios.post(`${pythonServerUrl}/analyze_emotion`, formData, {
//       headers: {
//         ...formData.getHeaders(),
//       },
//     });

//     // Extract emotion result from the response
//     const emotionResult = response.data.emotion;

//     // Assuming you have a WebSocket connection set up
//     // Emit the emotion result to the client

//     io.emit('emotion-result', emotionResult);

//     // Respond to the client with a success message
//     res.send('Emotion analysis complete');
//   } catch (error) {
//     // Log the error for debugging purposes
//     console.error('Error during emotion analysis:', error);

//     // Respond to the client with an internal server error message
//     res.status(500).send('Internal Server Error');
//   }
// });



const port = 3000;
server.listen(process.env.PORT||port, () => {
  console.log(`Server running on Port: ${port}`);
})

