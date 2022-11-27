const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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

        // Use Aggregate to query multiple collection and then merge data
        app.get('/categories', async (req, res) => {
            const query = {};
            const category = await categoriesCollection.find(query).toArray();
            res.send(category);
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