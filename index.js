const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xjhllfd.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        const categoriesCollection = client.db('laptopShop').collection('categories');
        const productsCollection = client.db('laptopShop').collection('products');
        const bookingsCollection = client.db('laptopShop').collection('bookings');
        const reportedCollection = client.db('laptopShop').collection('reported');
        const usersCollection = client.db('laptopShop').collection('users');
        const paymentsCollection = client.db('laptopShop').collection('payments');

        // Use Aggregate to query multiple collection and then merge data
        app.get('/categories', async (req, res) => {
            const query = {};
            const category = await categoriesCollection.find(query).toArray();
            res.send(category);
        });

        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const type = await categoriesCollection.findOne(query);
            res.send(type);   
        });

        app.get('/myproduct', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const myProduct = await productsCollection.find(query).toArray();
            res.send(myProduct);
        });

        app.get('/brands', async (req, res) => {
            const brand = req.query.brand;
            const query = { brand: brand };
            const brands = await productsCollection.find(query).toArray();
            res.send(brands);
        });

        app.get('/products', async (req, res) => {
            const query = {};
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });

        app.post('/products', async(req, res) =>{
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });

        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            
            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        });

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);
        });

        app.post('/bookings', async (req, res) =>{
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        app.get('/reported', async (req, res) => {
            const query = {};
            const reports = await reportedCollection.find(query).toArray();
            res.send(reports);
        });

        app.post('/reported', async (req, res) =>{
            const report = req.body;
            const result = await reportedCollection.insertOne(report);
            res.send(result);
        });

        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.expectedPrice;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = {_id: ObjectId(id)}
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
            res.send(result);
        });
        
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });

        app.get('/specialties', async (req, res) => {
            const specialty = req.query.specialty;
            const query = { specialty: specialty };
            const specialties = await usersCollection.find(query).toArray();
            res.send(specialties);
        });

        app.get('/users/Seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.specialty === 'Seller' });
        });

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.put('/users/admin/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

    }
    finally {

    }
}
run().catch(console.log);

app.get('/', async (req, res) => {
    res.send('Laptop2Hand server is running');
})

app.listen(port, () => console.log(`Laptop2Hand running on ${port}`))