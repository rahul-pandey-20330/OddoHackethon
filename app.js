//require all things 
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookie = require('cookie-parser');
const path = require('path');
const userModel = require("./models/user")
const Port = 3000;
const nodemailer = require('nodemailer');






app.use(cookie()); 
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(express.static(path.join(__dirname , 'public')));
app.set("view engine",'ejs');

// use multer for uploading images
const multer = require("multer");

// configure multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "public/uploads"));  // save in /public/uploads
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);  // unique filename
    }
});

const upload = multer({ storage: storage });

app.get("/",(req,res)=>{
    res.redirect("/users")
   
})
// sign Up Page
app.get("/signUp",(req,res)=>{
    res.render("signUp");
})
app.post('/signUp', upload.single('profileImage'), async (req, res) => {
  try {
    let { name, email, skilloffered, skillrequired, address, availability, password } = req.body;
    let user = await userModel.findOne({ email });
    if (user) return res.status(400).send("User already exists");

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        let newUser = await userModel.create({
          name,
          email,
          skilloffered,
          skillrequired,
          address,
          availability,
          password: hash,
          profileImage: req.file?.filename || ""
        });

        let token = jwt.sign({ email: email, userId: newUser._id }, "shhh");
        res.cookie("token", token);
        return res.redirect("/users"); // ✅ single response
      });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error");
  }
});


//  user login 
 app.get("/login",(req,res)=>{
    res.render("login")
});

app.post('/login',async(req,res)=>{
let {email , password} = req.body;
let user = await userModel.findOne({email});
if(!user)return res.status(500).send("Something Went Wrong");
bcrypt.compare(password , user.password,(err,result)=>{
let token = jwt.sign({ email: email, userId: user._id }, "shhh"); 
    res.cookie("token",token);
    if(result){
        res.status(200).redirect("/users");
    }
    else{
        res.redirect("/login");
    }
})
})

// all user
// Get all users with optional filtering
app.get("/users", async (req, res) => {
  const { availability, search } = req.query;
  let query = {};

  if (availability) query.availability = availability;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { skilloffered: { $regex: search, $options: "i" } },
      { skillrequired: { $regex: search, $options: "i" } }
    ];
  }

  const users = await userModel.find(query);

  // Extract current user from token
  let token = req.cookies.token;
  let currentUser = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, "shhh");
      currentUser = await userModel.findById(decoded.userId);
    } catch (err) {
      console.log("JWT error:", err);
    }
  }

  res.render("users", { users, query: req.query, currentUser });
});

// profile
app.get("/profile", async (req, res) => {
  const token = req.cookies.token;
  let currentUser = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, "shhh");
      currentUser = await userModel.findById(decoded.userId);
    } catch (err) {
      console.log("JWT error:", err);
    }
  }

  res.render("profile", { currentUser });
});
// swap request
app.get("/swaprequest",(req,res)=>{
    res.render("request");
     const recipientEmail = req.query.email;
  res.render("request", { recipientEmail });
})

app.post("/request-skill", async (req, res) => {
  const { recipientEmail, skillRequested, message } = req.body;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `Skill Request: ${skillRequested}`,
      text: message || `You have received a new skill request for: ${skillRequested}`,
    });

    res.status(200).send("Skill request sent successfully.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to send skill request.");
  }
});


app.listen(Port, ()=>{
    console.log(`App is listining on Port ${Port}`);
 
});