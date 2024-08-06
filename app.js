require('dotenv').config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI , function(err){
    if(!err){console.log("Success");}
    else{console.log(err);}
});

const toDoSchema = new mongoose.Schema({name : String});
const Item = mongoose.model("Item" , toDoSchema);
const item1 = new Item({name : "Something"});
const item2 = new Item({name : "Something Something"});
const customListSchema = new mongoose.Schema({
    list : String,
    name : [toDoSchema],
});
const CustomList = new mongoose.model("List" , customListSchema);

let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
let today  = new Date();
let date = today.toLocaleDateString("en-US", options);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.get("/" , function(req , res){
    Item.find(function(err , items)
    {
        res.render("list" , {date : date , content : "General list" , toDo : items});
    })
})

app.get("/about" , function(req , res)
{
    res.render("about");
})

app.get("/:listName" , function(req , res){
    CustomList.findOne({list : req.params.listName} , function(err , foundList){
        if(!err){
            if(foundList){
                res.render("list" , {date : date , content : req.params.listName , toDo : foundList.name});
            }
            else{
                const customList1 = new CustomList({
                    list : req.params.listName,
                    name : [item1 , item2]
                });
                customList1.save();
                res.redirect("/" + req.params.listName);
            }
        }
        else{
            console.log(err);
        }
    })
})

app.post("/" , function(req , res)
{
    const listTitle = req.body.button;
    const item = new Item({name : req.body.task});
    if(listTitle == "General")
    {
        item.save();
        res.redirect("/");
    }
    else
    {
        CustomList.findOne({list : listTitle} , function(err , foundList)
        {
            if(!err)
            {
                    foundList.name.push(item);
                    foundList.save();
                    res.redirect("/" + listTitle);
            }
            else
            {
                console.log(err);
            }
        });
    }
})

app.post("/del" , function(req , res)
{
    const listName = req.body.listName
    if(listName == "General")
    {
        Item.deleteOne({_id : req.body.checkbox} , function(err)
        {
            if(err){console.log(err);}
            else{console.log("Successfully deleted");}
        });
        res.redirect("/");
    }
    else
    {
        CustomList.findOneAndUpdate({list : listName} , {$pull : {name : {_id : req.body.checkbox}}} , function(err , result)
            {
                if(!err){res.redirect("/" + listName);}
            });
    }
})

app.listen(3000 , function()
{
    console.log("Server started");
})