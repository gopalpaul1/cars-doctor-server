const express = require('express');
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000

//middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_NAME}:${ process.env.KEY_SECRET}@cluster0.sxbfegy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db("carDoctor").collection("services");
    const bookingsCollention = client.db("carDoctor").collection("bookings"); 

    app.get("/services", async(req, res) => {
        const result = await servicesCollection.find().toArray();
        res.send(result);
    })

    app.get("/service/:id", async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const options = {
            // Include only the `title` and `imdb` fields in the returned document
            projection: {title: 1, imdb: 1, service_id: 1, img: 1, price: 1 },
          }
        const result = await servicesCollection.findOne(query, options);
        res.send(result);
    })

    app.get("/bookings", async(req, res) => {
        let query = {}

        console.log('tok tok token', req.cookies.token)
        if(req.query?.customerEmail) {
            query = {customerEmail
                : req.query.customerEmail}
        }
        const result = await bookingsCollention.find(query).toArray();
        console.log(result)
        res.send(result)
    })

    //jwt 
    app.post("/jwt", async(req, res) => {
        const user = req.body;
        console.log(user)
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
        res
        .cookie('token', token, {
            httpOnly: true,
            secure: false,  //for http request others for https its 'secure:true'
            sameSite: 'none'
        })
        .send({success: true})
    })
    //post mehtod
    app.post("/bookings", async(req, res) => {
        const bookingsUser = req.body;
        const result = await bookingsCollention.insertOne(bookingsUser)
        res.send(result);
    })

    app.patch("/bookings/:id", async(req, res) => {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const updateBooking = req.body;
        const updateDoc = {
            $set: {
                status: updateBooking.status
            }
        }
        const result = await bookingsCollention.updateOne(filter, updateDoc)
        res.send(result)
    })

    app.delete("/bookings/:id", async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await bookingsCollention.deleteOne(query);
        res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("cars doctors are working on server")
})


app.listen(port, () => {`cars doctors are running port ${port}`});