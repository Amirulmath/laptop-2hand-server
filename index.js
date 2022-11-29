const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xjhllfd.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoriesCollection = client.db('laptopShop').collection('categories');
        const productsCollection = client.db('laptopShop').collection('products');
        const bookingsCollection = client.db('laptopShop').collection('bookings');
        const reportedCollection = client.db('laptopShop').collection('reported');

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

        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        app.post('/bookings', async (req, res) =>{
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        app.post('/reported', async (req, res) =>{
            const report = req.body;
            const result = await reportedCollection.insertOne(report);
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