const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const socket = require("socket.io");
require("dotenv").config();


// Enable CORS for all routes
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods','POST, PUT, PATCH, GET, DELETE, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', '*');
//   res.setHeader('Access-Control-Allow-Credentials', 'true');
//   next();
// });
// const corsOrigin ={
//   origin: '*', //or whatever port your frontend is using
//   credentials:true,            
//   optionSuccessStatus:200
// }
const allowedOrigins = [
  "http://localhost:3000",
  "https://chatbuddy4.netlify.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));


// app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running successfully!" });
});

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connection Successful");
  })
  .catch((err) => {
    console.log(err.message);
  });

  



app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);

// const io = socket(server, {
//   cors: {
//     origin: "*",
//     credentials: true,
//   },
// });

const io = socket(server, {
  cors: {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
