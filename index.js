import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const port = 4000;
const app = express();

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));

const db = new pg.Client({
    user : "postgres",
    host : "localhost",
    database : "familytracker",
    password : "Server2012R2",
    port : 5432
})

db.connect();

let colour = "teal";
let currentUserId = 1;
let users = [{ id: 1, name: "Yash", color: "teal" }];

async function getUser(hostid){    
    console.log("host user = " + hostid);
    const result = await db.query("Select * from public.users");
    users = result.rows;  
    
    users.forEach((user) => {
        if(user.id === hostid){
            colour = user.color;                    
        }        
    });    
}

//JOIN public.users ON users.id = user_id 

async function visitedCountries(host){    
    console.log("host countries = " + host);
    let countries = [];

    //const result = await db.query("Select country_code from public.visited_countries where user_id=$1", [currentUserId]);
    const result = await db.query("Select country_code from public.visited_countries JOIN public.users ON users.id = user_id where user_id=$1", [host]);
    result.rows.forEach((country) => {
        countries.push(country.country_code);      
    });   
    return countries;
}

app.get("/", async (req,res) => {
    //console.log("currentidddd = " + currentUserId); 
    const countries = await visitedCountries(currentUserId);    
    await getUser(currentUserId);
    res.render("index.ejs", {
        countries : countries,
        total : countries.length,
        users : users,
        color : colour        
    });
});

app.post("/user", async (req,res) => {
    if(req.body.add === "new") {
        res.render("new.ejs");
        // res.redirect("/new");
    } else {
        currentUserId = req.body.add;        
        res.redirect("/");  
    }    
})

app.post("/add", async (req, res) => {
    const input = req.body["country"];  
    
    try{
        const result = await db.query("Select country_code From public.countries where LOWER(country_name) LIKE '%' || $1 || '%'", [input.toLowerCase()]);

        const data = result.rows[0];
        const country_code = data.country_code;

        try{
            db.query("Insert into visited_countries(country_code, user_id) values ($1,$2)", [country_code, currentUserId]);
            res.redirect("/");
        }catch(err){
            console.log(err);
        }
    }catch(err){
        console.log(err);
    }
});

app.post("/new", async (req, res) => {
    let name = req.body.name;
    let color = req.body.color;   

    const result = await db.query("INSERT INTO public.users(name, color) VALUES ($1, $2) RETURNING *;", [name, color]);
    const id = result.rows[0].id; 
    currentUserId = id;

    res.redirect("/");
});

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
})