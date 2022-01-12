//jshint esversion:6

const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose =require('passport-local-mongoose');
const app = express();

const port = process.env.PORT || 5000;

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(session({
  secret: 'Session secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});

const userSchema = new mongoose.Schema({
  username:String,
  useremail:String,
  userpassword:String,
  from:String,
  destination:String,
  Time:String,
  Status:String,
  Price:Number,
  Paid:String,
  driverName:String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get("/",(req,res)=>{
  res.render("userLogin");
});

app.get("/userLogin",(req,res)=>{
  res.render("userLogin");
});

app.get("/userRegister",(req,res)=>{
  res.render("userRegister");
});

app.get("/driverLogin",(req,res)=>{
  res.render("driverLogin");
});

app.get("/driverRegister",(req,res)=>{
  res.render("driverRegister");
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

app.get("/driverDash",function(req,res){
  User.find({"destination":{$ne:null}},function(err,foundUsers){
    if(err){
      console.log(err);
    }else{
      if(foundUsers){
        res.render("driverDash",{usersWithDesti: foundUsers});
      }
    }
  });
});

app.get("/userDash",function(req,res){
  if(req.isAuthenticated()){
    res.render("userDash",{location: req.user.destination,
      time: req.user.Time,
       status : req.user.Status,
     price: req.user.Price,
   id:req.user._id});
  }else{
    res.redirect("/userLogin");
  }
});

app.post("/userRegister",function(req,res){

 const user = new User({
    username:req.body.username,
    from:"",
    destination:"",
  });

User.register(user,req.body.password,function(err){
  if(err){
    console.log(err);
    res.redirect("/userRegister");
  }else{
    passport.authenticate("local")(req,res, function(){
    res.redirect("/userDash");
  });
}
});
});

app.post("/userLogin",function(req,res){
const user = new User({
  username:req.body.username,
  password:req.body.password,
});
req.login(user,function(err){
  if(err){
    console.log(err);
  }else{
    passport.authenticate("local")(req,res, function(){
      res.redirect("/userDash");
    });
  }
});
});

app.post("/driverRegister",function(req,res){
User.register({username:req.body.username},req.body.password,function(err){
  if(err){
    console.log(err);
    res.redirect("/driverRegister");
  }else{
    passport.authenticate("local")(req,res, function(){
    res.redirect("/driverDash");
  });
}
});
});

app.post("/driverLogin",function(req,res){
const user = new User({
  username:req.body.username,
  password:req.body.password
});
req.login(user,function(err){
  if(err){
    console.log(err);
  }else{
    passport.authenticate("local")(req,res, function(){
      res.redirect("/driverDash");
    });
  }
});
});

app.get("/content/:id",(req,res)=>{
  const id = req.params.id;
  User.findById(id,(err,user)=>{
    res.render("content",{user:user});
  });
});

app.post("/book",(req,res)=>{
const id = req.user.id;
User.findById(id,(err,foundUser)=>{
  if(err){
    console.log(err);
  }else{
    if(foundUser){
      foundUser.from = req.body.from;
      foundUser.destination = req.body.destination;
      foundUser.Time = req.body.rideTime;
      foundUser.Status = "on process";
      foundUser.save(function(err){
        if(!err){
          res.redirect("/userDash");
        }
      });
    }
  }
});
});

app.post("/driverSubmit/:id",(req,res)=>{
const id = req.params.id;
User.findById(id,(err,user)=>{
  if(!err){
    user.Price = req.body.price;
    user.driverName = req.user.username;
    user.Status = "Ride Confirmed";
    user.Paid  = "not";
    user.save((err)=>{
      if(!err){
        res.redirect("/driverDash");
      }
    });
  }else{
    console.log(err);
  }
});
});

app.post("/pay/:id",(req,res)=>{
  const id = req.params.id;
  User.findById(id,(err,user)=>{
    if(!err){
      user.Status = "payed for ride";
      user.Paid  = "payed";
      user.save((err)=>{
        if(!err){
          res.redirect("/userDash");
        }
      });
    }else{
      console.log(err);
    }
  });
});

app.post("/finish/:id",(req,res)=>{

const id = req.user.id;

User.findById(id,(err,foundUser)=>{
  if(err){
    console.log(err);
  }else{
    if(foundUser){
      foundUser.from = "";
      foundUser.destination = "";
      foundUser.Time ="";
      foundUser.Status = "";
      foundUser.Paid = "";
      foundUser.Price = "";
      foundUser.save(function(err){
        if(!err){
          res.redirect("/userDash");
        }
      });
    }
  }
});
});

app.listen(port,(err)=>{
  if(!err){
    console.log("server started");
  }else{
    console.log(err);
  }
});
