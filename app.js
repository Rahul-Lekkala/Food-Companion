const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-rahul:password97@cluster0.rc94s.mongodb.net/foodListDB",{useNewUrlParser: true , useUnifiedTopology: true, useFindAndModify: false});

const itemSchema = {
      name: String
};

// const Tiffin = mongoose.model("Tiffin",itemSchema);
// const OriginalTiffin = mongoose.model("OriginalTiffin",itemSchema);

const foodSchema = {
      name: String,
      items: [itemSchema],
      originalItems: [itemSchema]
}

const Food = mongoose.model("Food",foodSchema);

var chosenFood = "";

app.get("/",function(req,res){

      res.render("howto");

});

app.get("/food",function(req,res){
      res.render("breakfast",{foodType:food,food:chosenFood});
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
      const customListName = (req.params.foodType);
    
      Food.findOne({name:customListName},function(err,foundList){
        if(!err){
          if(!foundList)
          {
            console.log("Doesn't Exist");      
            const list = new Food({
              name: customListName,
              items: [],
              originalItems:[{name:"Dummy"}]
            });
            list.save();
            res.render("index", {foodType: customListName, newListItems: []});
          }
          else
          {
            console.log("Exists");
            console.log(foundList.items.length);

            if(foundList.items.length === 0 && foundList.originalItems.length !== 0)
            {
                  Food.findOne({name:customListName},function(err,foodList){

                        console.log(foodList.originalItems);
                        foodList.originalItems.forEach(function(err,foodItem){
                              const foodName = foodList.originalItems[foodItem].name;
                              if(foodName !== "Dummy")
                              {
                                    console.log(foodName);
                                    const newItemDoc = {
                                          name:foodName
                                    };
                                    foundList.items.push(newItemDoc);
                                    foundList.save();
                              }
                        });

                        // if(!err && foundList){
                        //       console.log("Found List : "+foundList);
                        //       foundList.items.push(newItemDoc);
                        //       foundList.originalItems.push(newItemDoc);
                        //       foundList.save();
                        //       res.redirect("/"+foodtype);
                        // }
                  });
            }

            res.render("index", {foodType: customListName, newListItems: foundList.items});
    
          }
        }
      });
    });

app.post("/",function(req,res){
      const newFood = req.body.newItem;
      const selector = req.body.selector;
      const foodtype = req.body.foodType;

      console.log("in post /" + "Food Item "+newFood+" foodType: "+foodtype);
      if(selector === "add"){
            const newItemDoc = {
                  name:newFood
            };

            Food.findOne({name:foodtype},function(err,foundList){
                  if(!err && foundList){
                        console.log("Found List : "+foundList);
                        foundList.items.push(newItemDoc);
                        foundList.originalItems.push(newItemDoc);
                        foundList.save();
                        res.redirect("/"+foodtype);
                  }
            });

            // const newTiffin = new Tiffin({
            //       name: newFood
            // });

            // const originalTiffin = new OriginalTiffin({
            //       name: newFood
            // });                             
            // originalTiffin.save();

            // newTiffin.save(function(err){
            //       if (!err){         
            //       res.redirect("/");
            //       }
            // });
      }
      else if(selector === "select"){

            Food.find({name:foodtype},function(err,foundList){
                  if(!err){
                        console.log(foundList);
                  }
            });

            // Food.findOneAndUpdate(
            //       {name:foodType},
            //       {$pull:
            //             {items:
            //                   {_id:}
            //             }
            //       }
            // );

            // Tiffin.count().exec(function(err,count){
            //       if(count === 0)
            //       {
            //             res.render("breakfast",{tiffin:"Please add a breakfast to select from!!!"});
            //       }
            //       else{
            //             const randomNumber = Math.floor(Math.random() * count);

            //             Tiffin.findOne().skip(randomNumber).exec(function(err,result){
            //                   console.log(result);
            //                   Tiffin.findByIdAndRemove(result._id,function(err){
            //                         if(!err)
            //                         {
            //                               res.render("breakfast",{tiffin:result.name});
            //                         }
            //                   });
            //             });
            //       }
            // });
      }
      else{
            res.redirect("/");
      }
});

app.post("/random",function(req,res){
      const foodtype = req.body.foodType;
      Food.find({name:foodtype},function(err,foundList){
            if(!err){
                  console.log(foundList);
                  console.log(foundList[0].items);
                  console.log("No. of docs : "+foundList[0].items.length);
                  const numOfItems = foundList[0].items.length;
                  if(numOfItems > 0)
                  {
                        const randomNumber = Math.floor(Math.random() * numOfItems);

                        console.log("Random Doc : "+foundList[0].items[randomNumber]);
                        const randomDoc = foundList[0].items[randomNumber];
                        const randomFood = randomDoc.name;

                        Food.findOneAndUpdate(
                              {name:foodtype},
                              {$pull:
                                    {items:
                                          {_id:randomDoc._id}
                                    }
                              },
                              function(err, foundFood){
                                    if(!err){
                                          res.render("breakfast",{foodType:foodtype,food:randomFood});
                                    }
                              }
                        );
                  }
                  else
                  {
                        res.render("breakfast",{foodType:foodtype,food:"You need to add a breakfast item to select from"});
                  }

            }
      });
});

app.post("/delete",function(req,res){
      const checkedItemId = req.body.checkbox;
      const foodtype = req.body.foodType;

      // console.log("ID = "+checkedItemId);
      // console.log(req.body);
    
      // Food.find({name:foodtype},function(err,foundList){
      //       if(!err){
      //             console.log(foundList);
      //             console.log(foundList[0].items);
      //             console.log("No. of docs : "+foundList[0].items.length);
      //             const numOfItems = foundList[0].items.length;
      //             if(numOfItems > 0)
      //             {
      //                   foundList[0].items.forEach(function(foodItem){
      //                         if(checkedItemId == foodItem._id)
      //                         {console.log(foodItem.name);}else{
      //                               console.log("A"+foodItem.name);
      //                         }
      //                   });
      //             }
      //       }
      // });

      Food.findOneAndUpdate(
            {name:foodtype},
            {$pull:
                  {items:
                        {_id:checkedItemId}
                  }
            },
            function(err, foundFood){
                  if(!err){
                        console.log("Foundfood = "+foundFood);
                        res.render("breakfast",{foodType:foodtype,food:req.body.food});
                  }
            }
      );
});

app.post("/reset",function(req,res){

      const resetFood = [];

      if(req.body.breakfast)
      {
            resetFood.push("Breakfast");
            Food.deleteOne({name:"breakfast"},function(err,deletedList){
                  if(!err)
                  {
                        console.log("List : "+deletedList);
                  }
            });
      }
      if(req.body.lunch)
      {
            resetFood.push("Lunch");
            Food.deleteOne({name:"lunch"},function(err,deletedList){
                  if(!err)
                  {
                        console.log(deletedList);
                        resetFood.push("Lunch");
                  }
            });
      }
      if(req.body.dinner)
      {
            resetFood.push("Dinner");
            Food.deleteOne({name:"dinner"},function(err,deletedList){
                  if(!err)
                  {
                        console.log(deletedList);
                        resetFood.push("Dinner");
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