// Load express
const express  = require("express");
const app = express()
const bodyParser = require("body-parser");
const axios = require("axios");

app.use(bodyParser.urlencoded({extended: true})); 
app.use(bodyParser.json()); 

// Load Mongoose
const mongoose = require("mongoose");

// Global User Object which will be the instance of MongoDB document
var User;
async function connectMongoose() {
	await mongoose.connect("mongodb://localhost:27017/User", { useNewUrlParser: true, useUnifiedTopology:true }).then(() =>{
		console.log("mongoose connected..")
	})
	require("./User")
	User = mongoose.model("User")
}


// Load initial modules
async function initialLoad() {
	await connectMongoose();
}

initialLoad()
/*** IMPROVEMENT: Each API can sit in a different file if we want to scale the application to perform larger operations
 */

// Main endpoint
app.get("/", (req, res) => {
	res.send("This is our main endpoint")
})


// GET all users
app.get("/users",async (req, res) => {
	User.find().then((users) => {
		res.send(users)
	}).catch((err) => {
		if(err) {
			throw err
		}
	})
})


// GET single user
app.get("/users/:uid",async (req, res) => {
	User.findById(req.params.uid).then((user) => {
		if(user){
			res.json(user)
		} else {
			res.sendStatus(404)
		}
	}).catch( err => {
		if(err) {
			throw err
		}
	})
})


 //authontecation of user
app.get("/user/:uid/auth",async(req,res)=>{
	axios.get(`/auth?uid=${req.params.uid}`).then((auth)=>{
   if(auth){
     res.send(auth)
    }
	}).catch(err=>{
		res.sendStatus(404).send(err)
	})
})


// GET all orders for an user
app.get("/users/:uid/orders", async (req, res) => {
	axios.get(`/orders?uid=${req.params.uid}`).then( (orders) => {
		if(orders) {
			res.send(orders)
		}
	}).catch( err => {
		res.sendStatus(404).send(err)
	})
})


// Create new user
app.post("/user", async (req, res) => {
	const newUser = {
		"firstName":req.body.firstName,
		"lastName": req.body.lastName,
		"email":req.body.email,
		"phone": req.body.phone,
		"address": req.body.address,
		"orders": req.body.orders,
		"auth":req.body.auth
	}

	
	// Create new User instance..
	const user = new User(newUser)
	user.save().then((r) => {
		res.send("User created..")
	}).catch( (err) => {
		if(err) {
			throw err
		}
	})
	
})


// Create new order for a user
app.post("/users/:uid/order", async (req, res) => {
	try {
		const orderResponse = await axios.post("http://localhost:5151/order",{
			name:req.body.name,
			customerId: mongoose.Types.ObjectId(req.params.uid),
			amount:req.body.amount,
			image:req.body.image,
			createdAt:req.body.createdAt,
			qty:req.body.qty
		})
		
		if(orderResponse.status === 200) {
			User.findById(req.params.uid, (err, user) => {
				user.orders.push(orderResponse.data._id)
				user.save().then(() => {
					res.send(`Order created for user:${user.email} with orderId:${orderResponse.data._id}`)
				}).catch(e => {
					res.send("failed to add orderId in user's doc")
				})
			})	
		} else {
			res.send("Order not created..")
		}
	} catch (error) {
		res.sendStatus(400).send("Error while creating the order")
		
	}
})

// Update user by userId
 app.put("/users/:uid",(req,res)=>{
	 user.findById(req.params.uid,(err,user)=>{
		user.firstName=req.body.firstName , 
		user.lastName=req.body.lastName , 
		user.email=req.body.email , 
		user.phone=req.body.phone , 
		user.address=req.body.address, 
		user.orders=req.body.orders ,
		user.Auth=req.body.Auth
	 user.save()
	 res.json()
	 if(err)
	  {console.log('massage error:',err)}
	})
 })


 // Update orders to the user
 app.put("/users/:uid/orders", async (req, res) => {
	axios.put(`http://localhost:5151/orders?uid=${req.params.uid}`).then( UpRes => {
		 const orderResponse = axios.put("http://localhost:5151/order",{
			name:req.body.name,
			customerId: mongoose.Types.ObjectId(req.params.uid),
			amount:req.body.amount,
			image:req.body.image,
			createdAt:req.body.createdAt,
			qty:req.body.qty
		})
		if(UpRes.data.success) {
			res.send("Orders update..")
		} else {
			res.sendStatus(404).send(UpResRes.data)
		}
	}).catch( (err) => {
		res.sendStatus(404).send(err)
	})
})


// Delete user by userId
app.delete("/users/:uid", async (req, res) => {
	User.findByIdAndDelete(req.params.uid).then(() => {
		res.send("User deleted with success...")
	}).catch( () => {
		res.sendStatus(404)
	})
})


// Delete all the orders for an user
app.delete("/users/:uid/orders", async (req, res) => {
	axios.delete(`http://localhost:5151/orders?uid=${req.params.uid}`).then( delRes => {
		if(delRes.data.success) {
			res.send("Orders deleted..")
		} else {
			res.sendStatus(404).send(delRes.data)
		}
	}).catch( (err) => {
		res.sendStatus(404).send(err)
	})
})

// APP listening on port 4040
app.listen(5050, () => {
	console.log("Up and running! -- This is our Users service")
})