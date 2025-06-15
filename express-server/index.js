const express = require('express');
const {MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const uri = "mongodb+srv://austinszj:LJIaSVlUvywyOtn2@learning.jndel8m.mongodb.net/";

const cryptPassword = (password, callback) => {
    bcrypt.genSalt(10, (err, salt) => {
        if (err) throw err;
        bcrypt.hash(password, salt, (err, hash) => {
            if (err) throw err;
            console.log('Hashed password:', hash);
            callback(hash)
        });
    }
    );
}

const comparePassword = (password, hash, callback) => {
    bcrypt.compare(password, hash, (err, isMatch) => {
        if (err) throw err;
        console.log('Password match:', isMatch);
        callback(isMatch);
    });
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true, 
    deprecationErrors: true
  }

});

// user collection
// create
app.post('/users/register', async (req, res) => {
  const {body} = req;
  const {username, password} = body;
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const database = client.db('Test');
    const users = database.collection('user');

    cryptPassword(password, async (hash) => {
        const result = await users.insertOne({username, password: hash});
        res.status(201).json({ message: 'User created', userId: result.insertedId });
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send('Internal Server Error');
  } 
}
);
// login, this is sooo wrong, absolutely wrong!! 
//this is so ugly, so wrong
app.post('/users/login', async (req, res) => {
  const { body } = req;
  const {username, password} = body;
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const database = client.db('Test');
    const users = database.collection('user');

    const user = await users.findOne({username});
    
    if (!user) {
        res.send({'message': 'User not found'});
        return;

    //   return res.status(404).send('User not found');
    }
    console.log('User found:', user);
    // Check if the password matches
    comparePassword(password, user.password, async (isMatch) => {
        if (!isMatch) {
            res.send({'message': 'Invalid credentials'});
            return;
            // return res.status(401).send('Invalid credentials');
        }
        console.log('Password match successful, fetching user...');
        const {password, ...userData} = user; // Exclude password from response
        res.json(userData);
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).send('Internal Server Error');
  } 
}
);

// message collection
// create
app.post('/messages', async (req, res) => {
  const {body} = req;
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const database = client.db('Test');
    const messages = database.collection('message');
    
    const result = await messages.insertOne({...body});
    
    res.status(201).json({ message: 'Message created', messageId: result.insertedId });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).send('Internal Server Error');
  } 
}
);

// Search keywords
// can we really use the same path? 
app.get('/products/search', async (req, res) => {
    const {keyword} = req.query;
    let searchText = keyword.toLowerCase();
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const database = client.db('Test');
        const products = database.collection('products');

        const searchResults = await products.find({tag: searchText}).toArray();
        res.json(searchResults);

    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).send('Internal Server Error');
    }
}
);


// products collection
// read 
app.get('/products', async (req, res) => {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const database = client.db('Test');
    const products = database.collection('products');
    
    const productList = await products.find({}).toArray();
    res.json(productList);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  } 
}
);
// read one
app.get('/products/:id', async (req, res) => {
  const {id} = req.params;
  try {
    // connections
    await client.connect();
    console.log('Connected to MongoDB');
    const database = client.db('Test');
    const products = database.collection('products');
    
    // find one product by id
    const product = await products.findOne({_id: new ObjectId(id)});
    
    if (!product) {
      return res.status(404).send('Product not found');
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).send('Internal Server Error');
  } 
}
);
// create
app.post('/products', async (req, res) => {
  const {body} = req;
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const database = client.db('Test');
    const products = database.collection('products');
    
    // const newProduct = body; // Assuming the product data is sent in the request body
    const result = await products.insertOne({...body});
    
    res.send(result);
    res.status(201).json({ message: 'Product created', productId: result.insertedId });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).send('Internal Server Error');
  } 
})
// update
app.put('/products/:id', async (req, res) => {
  const {id} = req.params;
  const {body} = req;
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('Test');
    const products = database.collection('products');
    
    const result = await products.updateOne(
      {_id: new ObjectId(id)},
      {$set: body}
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).send('Product not found');
    }
    
    res.json({ message: 'Product updated' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).send('Internal Server Error');
  } 
});

// patch: can use incomplete data to update

// delete
app.delete('/products/:id', async (req, res) => {
  const {id} = req.params;
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db('Test');
    const products = database.collection('products');
    
    const result = await products.deleteOne({_id: new ObjectId(id)});
    
    if (result.deletedCount === 0) {
      return res.status(404).send('Product not found');
    }
    
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).send('Internal Server Error');
  } 
}
);

app.get('/', (req, res) => {
  res.send('Hello World!');
}
);

app.get('/test', (req, res) => {
  res.send('Test route!');
}
);

// CRUD
// create, read, update, delete

app.listen(4000, () => console.log('Server is running on port 4000'));

