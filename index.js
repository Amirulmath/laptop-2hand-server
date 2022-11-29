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

        // Use Aggregate to query multiple collection and then merge data
        app.get('/categories', async (req, res) => {
            const query = {};
            const category = await categoriesCollection.find(query).toArray();
            res.send(category);
        });

        app.get('/myproduct', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const myProduct = await productsCollection.find(query).toArray();
            res.send(myProduct);
        })

        app.get('/products', async (req, res) => {
            const query = {};
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });

        // app.get('/products/:brand', async (req, res) => {
        //     const brand = req.params.brand;
        //     const query = {brand: ObjectId(brand)};
        //     const productsBrand = await productsCollection.filter(query);
        //     res.send(productsBrand);
        // });
        
        app.post('/products', async(req, res) =>{
            const product = req.body;
            const result = await productsCollection.insertOne(product);
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