require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const facebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");
var async = require('async');

const app = express();

app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.use(session({
      secret: process.env.SESSION_SECRET,       // To use this, create a variable named SESSION_SECRET in .env and assign the secret
      resave: false,
      saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

//mongoose.connect("mongodb+srv://admin-rahul:password97@cluster0.rc94s.mongodb.net/foodListDB",{useNewUrlParser: true , useUnifiedTopology: true, useFindAndModify: false});
mongoose.connect(process.env.MONGODB_URI,{useNewUrlParser: true , useUnifiedTopology: true, useFindAndModify: false});
mongoose.set("useCreateIndex",true);

const itemSchema = {
      name: String
};

const Item = mongoose.model("Item",itemSchema);

// const Tiffin = mongoose.model("Tiffin",itemSchema);
// const OriginalTiffin = mongoose.model("OriginalTiffin",itemSchema);

const foodSchema = new mongoose.Schema({
      // googleId: String,
      // facebookId: String,
      name: String,
      items: [itemSchema],
      originalItems: [itemSchema]
});

const Food = mongoose.model("Food",foodSchema);

const userSchema = new mongoose.Schema({
      //googleId: String,
      //facebookId: String,
      socialMediaID: String,
      // name: String,
      // items: [itemSchema],
      // originalItems: [itemSchema]
      food: [foodSchema]
});

userSchema.plugin(findOrCreate);
foodSchema.plugin(findOrCreate);

const User= mongoose.model("User", userSchema);

// passport.serializeUser(function(user, done){
//       done(null, user.id);
// });

// passport.deserializeUser(function(id,done){
//       User.findById(id, function(err,user){
//             done(err, user);
//       });
// });

passport.serializeUser(function(user, done){
      done(null, user.id);
});

passport.deserializeUser(function(id,done){
      User.findById(id, function(err,user){
            done(err, user);
      });
});

passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/food"
      },
      function(accessToken, refreshToken, profile, done) 
      {
            console.log(accessToken);
            console.log(refreshToken);
            console.log(profile);
            process.nextTick(function() 
            {
                  // Food.findOrCreate({ facebookId: profile.id }, function (err, user) {
                  //       console.log(err);
                  //       console.log(user);
                  //       return done(err, user);
                  // });
                  // find the user in the database based on their facebook id
                  User.findOne({ 'socialMediaID' : profile.id }, function(err, user) 
                  {
                        // if there is an error, stop everything and return that
                        // ie an error connecting to the database
                        if (err)
                              return done(err);
      
                        // if the user is found, then log them in
                        if (user) {
                              //console.log("user found")
                              //console.log(user)
                              return done(null, user); // user found, return that user
                        } else {
                              // if there is no user found with that facebook id, create them
                              var newUser = new User();
            
                              // set all of the facebook information in our user model
                              //newUser.googleId = profile.id; // set the users google id                   
                              newUser.socialMediaID = profile.id;

                              // save our user to the database
                              newUser.save(function(err) {
                              if (err)
                                    throw err;
            
                              // if successful, return the new user
                              return done(null, newUser);
                              });
                        }
                  });
            })
      }
));

passport.use(new facebookStrategy({
            clientID: process.env.FB_CLIENT_ID,
            clientSecret: process.env.FB_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/facebook/food",
            profileFields:["id","displayName"]
      },
      function(token, refreshToken, profile, done) 
      {
            // asynchronous
            process.nextTick(function() 
            {
                  // Food.findOrCreate({ facebookId: profile.id }, function (err, user) {
                  //       console.log(err);
                  //       console.log(user);
                  //       return done(err, user);
                  // });
                  // find the user in the database based on their facebook id
                  User.findOne({ 'socialMediaID' : profile.id }, function(err, user) 
                  {
                        // if there is an error, stop everything and return that
                        // ie an error connecting to the database
                        if (err)
                              return done(err);
      
                        // if the user is found, then log them in
                        if (user) {
                              //console.log("user found")
                              //console.log(user)
                              return done(null, user); // user found, return that user
                        } else {
                              // if there is no user found with that facebook id, create them
                              var newUser = new User();
            
                              // set all of the facebook information in our user model
                              //newUser.facebookId = profile.id; // set the users facebook id                   
                              newUser.socialMediaID = profile.id;
                              // save our user to the database
                              newUser.save(function(err) {
                              if (err)
                                    throw err;
            
                              // if successful, return the new user
                              return done(null, newUser);
                              });
                        }
                  });
            })
      }
));

app.get("/auth/facebook",
      passport.authenticate("facebook", {scope: ["email"]}));

app.get("/auth/facebook/food",
      passport.authenticate("facebook",{
            successRedirect: "/breakfast",
            failureRedirect: "/"
      })
);

app.get("/auth/google",
      passport.authenticate("google", {scope: ["profile"]}));

app.get("/auth/google/food",
      passport.authenticate("google", {
            successRedirect: "/breakfast",
            failureRedirect: "/"
      })
);

var chosenFood = "";

app.get("/",function(req,res){
      if(req.isAuthenticated()){
            res.redirect("/breakfast");
      }else{
            res.render("login");
      }
});

app.get("/food",function(req,res){
      if(req.isAuthenticated()){
            res.render("breakfast",{foodType:food,food:chosenFood});
      }else{
            res.redirect("/");
      }
});


app.get("/logout",function(req,res){
      req.logout();
      res.redirect("/");
});

// app.get("/breakfast",function(req,res){
//       Tiffin.countDocuments().exec(function(err,count){
//             if(count === 0)
//             {
//                   OriginalTiffin.countDocuments().exec(function(err,actualCount){
//                         console.log(actualCount);
//                   if(actualCount>0){
//                         OriginalTiffin.find(function(err,tiffins){

//                               tiffins.forEach(function(tiffin){
//                                     const newTiffin = new Tiffin({
//                                           name:tiffin.name
//                                     });
//                                     newTiffin.save();
                                    
//                               });
//                               console.log(tiffins);
//                         });
//                         }
//                   });
//             }
//       });
      
//       Tiffin.find(function(err,tiffins)
//       {
//             if(!err){
//                   res.render("index",{newListItems:tiffins});
//             }
//       });
// });

app.get("/:foodType", function(req,res){

      if(req.isAuthenticated())
      {
            const customListName = (req.params.foodType);
            //console.log("Req in /:foodType = "+req.user);
            
            //console.log("REceived ID - "+req.user.socialMediaID);

            User.findOne({"socialMediaID": req.user.socialMediaID},function(err,user){
                  //console.log("Found Google User is "+ user);
                  if(!err){
                        if(user){
                              if(!(Array.isArray(user.food) && user.food.length))
                              {
                                    //Add a schema
                                    //console.log("Filling schema in if(users.food) with "+customListName);
                                    const newDoc = new Food({
                                          name: customListName,
                                          items: [],
                                          originalItems:[{name:"Dummy"}]
                                    });
                                    user.food.push(newDoc);
                                    user.save();
                                    res.render("index", {foodType: customListName, newListItems: []});
                              }else
                              {      //Schema is available
                                    
                                    //console.log("User Food "+user.food);
                                    //console.log("Schema availble-"+foundList);
                                    let found = false;

                                    Object.keys(user.food).forEach(key => {
                                          //console.log(key, user.food[key].name);
                                          const foodObject = user.food[key];
                                          const foodType = foodObject.name;

                                          //console.log(foodType, foodObject.originalItems);
                                          if(foodType == customListName){
                                                found = true;
                                          }
                                    });

                                    if(found === false){    // FoodType is not created, create one
                                          const newDoc = new Food({
                                                name: customListName,
                                                items: [],
                                                originalItems:[{name:"Dummy"}]
                                          });
                                          user.food.push(newDoc);
                                          user.save();
                                          //console.log("Filling schema in if(user.food.name != customListName) with "+customListName);
                                          res.render("index", {foodType: customListName, newListItems: []});
                                    }
                                    else{
                                           // FoodType is available, display to the user
                                           //console.log("Exists");
                                           //console.log(user.food.items.length);
                                           let foodIndex = 0;

                                           if(customListName == "lunch"){
                                                 foodIndex = 1;
                                           }else if(customListName == "dinner"){
                                                 foodIndex = 2;
                                           }

                                           Object.keys(user.food).forEach(key => {
                                                //console.log(key, user.food[key].name);
                                                const foodObject = user.food[key];
                                                const foodType = foodObject.name;

                                                if(foodType == customListName){

                                                      if(foodObject.items.length === 0 && foodObject.originalItems.length !== 0)
                                                      {
                                                            async.each(foodObject.originalItems, function (item, callback) {
                                                                  //console.log("------"+item);
                                                                  if(item.name !== "Dummy")
                                                                  {
                                                                        const newItemDoc = {
                                                                              name:item.name
                                                                        };

                                                                        //itemList.push(newItemDoc);
                                                                        user.food[foodIndex].items.push(newItemDoc);
                                                                  }
                                                            });
                                                            user.save();
                                                      }
                                                      res.render("index", {foodType: customListName, newListItems: user.food[key].items});
                                                }

                                          });
                                    }
                              }
                        }
                  }
            });
      }
      else
      {
            res.redirect("/");
      }
});

app.post("/",function(req,res){
      const newFood = req.body.newItem;
      const selector = req.body.selector;
      const foodtype = req.body.foodType;

      //console.log("in post /" + "Food Item "+newFood+" foodType: "+foodtype);
      if(selector === "add"){
            const newItemDoc =  new Item({
                  name:newFood
            });

            let foodIndex = 0;

            if(foodtype == "lunch"){
                  foodIndex = 1;
            }else if(foodtype == "dinner"){
                  foodIndex = 2;
            }
            //"socialMediaID": req.user.socialMediaID
            User.findOne({"socialMediaID": req.user.socialMediaID},function(err,user){
                  //console.log("Found User is "+ user);
                  if(!err){
                        if(user){
                              User.find({
                                    "socialMediaID": req.user.socialMediaID, 
                                    'food.name': foodtype
                              },function(err, foodList){
                                    //console.log(foodList);
                              //console.log(foodList[0].food);
                              //console.log("---Food Type = "+foodList[0].food[foodIndex].name);
                              //console.log("+++Food Type = "+user.food[foodIndex].name);
                              //console.log(foodList[0].food[foodIndex].originalItems);
                              user.food[foodIndex].items.push(newItemDoc);
                              user.food[foodIndex].originalItems.push(newItemDoc);
                              user.save(function(){
                                    //res.render("index", {foodType: foodtype, newListItems: foodList[0].food[foodIndex].items});
                                    res.redirect("/"+foodtype);
                              });
                              
                        });
                        }
                  }
            });

            // Food.findOne({name:foodtype},function(err,foundList){
            //       if(!err && foundList){
            //             console.log("Found List : "+foundList);
            //             foundList.items.push(newItemDoc);
            //             foundList.originalItems.push(newItemDoc);
            //             foundList.save();
            //             res.redirect("/"+foodtype);
            //       }
            // });
      }
      else{
            res.redirect("/");
      }
});

app.post("/random",function(req,res){
      const foodtype = req.body.foodType;

      let foodIndex = 0;

      if(foodtype == "lunch"){
            foodIndex = 1;
      }else if(foodtype == "dinner"){
            foodIndex = 2;
      }
            
      User.findOne({"socialMediaID": req.user.socialMediaID},function(err,user){
            //console.log("Found User is "+ user);
            if(!err){
                  if(user){
                        //console.log("Checked ID - "+checkedItemId);
                        //console.log("User Food - "+user.food[foodIndex].items);

                        //Find if food items are available to select from
                        let foodItemsLength = 0;
                        Object.keys(user.food).forEach(key => {
                              //console.log(key, user.food[key].name);
                              const foodObject = user.food[key];
                              
                              //console.log(foodType, foodObject.items.length);

                              if(foodtype == foodObject.name){
                                    foodItemsLength = foodObject.items.length;
                              }
                              
                        });

                        if(foodItemsLength == 0){
                              res.render("breakfast",{foodType:foodtype,food:"You need to add a dish to select from"});
                        }else{
                              let randomFoodID = 0;
                              let randomFood = "";
                              const randomNumber = Math.floor(Math.random() * foodItemsLength);

                              //console.log("Random Number = "+ randomNumber);
                              //Select a random food item
                              Object.keys(user.food).forEach(key => {
                                    //console.log(key, user.food[key].name);
                                    const foodObject = user.food[key];
                                    const foodType = foodObject.name;

                                    //console.log(foodType, foodObject.items);

                                    if(foodtype == foodObject.name){
                                          randomFoodID = foodObject.items[randomNumber]._id;
                                          randomFood = foodObject.items[randomNumber].name;
                                    }
                                    
                              });

                              //console.log("Random ID = "+ randomFoodID);

                              // delete the item with the selected randomID
                              user.food[foodIndex].items.pull(randomFoodID);
                              user.save(function(){
                                    res.render("breakfast",{foodType:foodtype,food:randomFood});
                              });
                        }
                        
                  }
            }
      });

      // Food.find({name:foodtype},function(err,foundList){
      //       if(!err){
      //             console.log(foundList);
      //             console.log(foundList[0].items);
      //             console.log("No. of docs : "+foundList[0].items.length);
      //             const numOfItems = foundList[0].items.length;
      //             if(numOfItems > 0)
      //             {
      //                   const randomNumber = Math.floor(Math.random() * numOfItems);

      //                   console.log("Random Doc : "+foundList[0].items[randomNumber]);
      //                   const randomDoc = foundList[0].items[randomNumber];
      //                   const randomFood = randomDoc.name;

      //                   Food.findOneAndUpdate(
      //                         {name:foodtype},
      //                         {$pull:
      //                               {items:
      //                                     {_id:randomDoc._id}
      //                               }
      //                         },
      //                         function(err, foundFood){
      //                               if(!err){
      //                                     res.render("breakfast",{foodType:foodtype,food:randomFood});
      //                               }
      //                         }
      //                   );
      //             }
      //             else
      //             {
      //                   res.render("breakfast",{foodType:foodtype,food:"You need to add a breakfast item to select from"});
      //             }

      //       }
      // });
});

app.post("/delete",function(req,res){
      const checkedItemId = req.body.checkbox;
      const foodtype = req.body.foodType;

      let foodIndex = 0;

      if(foodtype == "lunch"){
            foodIndex = 1;
      }else if(foodtype == "dinner"){
            foodIndex = 2;
      }

      User.findOne({"socialMediaID": req.user.socialMediaID},function(err,user){
            //console.log("Found User is "+ user);
            if(!err){
                  if(user){
                        //console.log("Checked ID - "+checkedItemId);
                        //console.log("User Food - "+user.food[foodIndex].items);
                        
                        user.food[foodIndex].items.pull(checkedItemId);
                        user.save(function(){
                              res.render("breakfast",{foodType:foodtype,food:req.body.food});
                        });                        
                  }
            }
      });

      // Food.findOneAndUpdate(
      //       {name:foodtype},
      //       {$pull:
      //             {items:
      //                   {_id:checkedItemId}
      //             }
      //       },
      //       function(err, foundFood){
      //             if(!err){
      //                   console.log("Foundfood = "+foundFood);
      //                   res.render("breakfast",{foodType:foodtype,food:req.body.food});
      //             }
      //       }
      // );
});

app.post("/reset",function(req,res){

      const resetFood = [];

      let foodIndex = 0;

      if(req.body.breakfast)
      {
            resetFood.push("Breakfast");
            User.updateOne(
                  {
                        "socialMediaID": req.user.socialMediaID
                        //'food.name': "breakfast"
                  },
                  { 
                        $pull: {
                              //'food.0._id': [idOfFood] 
                              "food" : { "name": "breakfast"}
                        } 
                  },
                  {safe: true},
                  function(err,deletedList){
                  if(!err)
                  {
                        console.log(deletedList);
                        resetFood.push("Lunch");
                  }
            });
            
      }
      if(req.body.lunch)
      {
            foodIndex = 1;
            resetFood.push("Lunch");
            User.updateOne(
                  {
                        "socialMediaID": req.user.socialMediaID
                        //'food.name': "breakfast"
                  },
                  { 
                        $pull: {
                              //'food.0._id': [idOfFood] 
                              "food" : { "name": "lunch"}
                        } 
                  },
                  {safe: true},
                  function(err,deletedList){
                  if(!err)
                  {
                        console.log(deletedList);
                        resetFood.push("Lunch");
                  }
            });
      }
      if(req.body.dinner)
      {
            foodIndex = 2;
            resetFood.push("Dinner");
            User.updateOne(
                  {
                        "socialMediaID": req.user.socialMediaID
                  },
                  { 
                        $pull: {
                              "food" : { "name": "dinner"}
                        } 
                  },
                  {safe: true},
                  function(err,deletedList){
                  if(!err)
                  {
                        console.log(deletedList);
                        resetFood.push("Lunch");
                  }
            });
      }
      console.log(resetFood);
      res.render("reset",{resetFood:resetFood});
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
      console.log("Server started on port "+port);
});