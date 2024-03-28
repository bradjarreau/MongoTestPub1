const { MongoClient } = require("mongodb");
const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const port = 3000;

// MongoDB connection URI
const uri = "mongodb+srv://bradjarreau:Genesis11@bjmdb.idurez2.mongodb.net/?retryWrites=true&w=majority";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// MongoDB client
const client = new MongoClient(uri);

// Default route
app.get('/', function(req, res) {
  res.redirect('/login-form');
});

// Registration form route that gets them registered
app.get('/register-form', function(req, res) {
  var form = '<form action="/register" method="post">';
  form += '<label for="username">Username:</label>';
  form += '<input type="text" id="username" name="username"><br>';
  form += '<label for="password">Password:</label>';
  form += '<input type="password" id="password" name="password"><br>';
  form += '<input type="submit" value="Register">';
  form += '</form>';
  form += '<p><a href="/login-form">Already registered? Login here</a>';
  res.send(form);
});

// Registration endpoint
app.post('/register', async function(req, res) {
  const { username, password } = req.body;

  try {
    await client.connect();
    const database = client.db('bjmdb');
    const usersCollection = database.collection('users');

    // Insert new user into database
    await usersCollection.insertOne({ username, password });
    res.send('User registered successfully. <a href="/login-form">Login now</a>.');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('An error occurred while registering user.');
  } finally {
    await client.close();
  }
});

// Login form route
app.get('/login-form', function(req, res) {
  var form = '<form action="/login" method="post">';
  form += '<label for="username">Username:</label>';
  form += '<input type="text" id="username" name="username"><br>';
  form += '<label for="password">Password:</label>';
  form += '<input type="password" id="password" name="password"><br>';
  form += '<input type="submit" value="Login">';
  form += '</form>';
  form += '<p><a href="/register-form">Not registered yet? Register here</a>';
  res.send(form);
});

// Login endpoint
app.post('/login', async function(req, res) {
  const { username, password } = req.body;

  try {
    await client.connect();
    const database = client.db('bjmdb');
    const usersCollection = database.collection('users');

    // Check if user exists and credentials match
    const user = await usersCollection.findOne({ username, password });
    if (user) {
      // Set authentication cookie with short expiry time (e.g., 1 minute)
      res.cookie('authenticated', true, { maxAge: 60000 });
      res.send('Login successful. Authentication cookie set. <a href="/report-cookies">View Active Cookies</a>');
    } else {
      res.status(401).send('Invalid username or password. <a href="/login-form">Try again</a>.');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('An error occurred while logging in.');
  } finally {
    await client.close();
  }
});

// Report all active cookies
app.get('/report-cookies', function(req, res) {
  const cookies = req.cookies;
  let cookieList = '<h2>Active Cookies:</h2>';
  for (const cookie in cookies) {
    cookieList += `<p>${cookie}: ${cookies[cookie]}</p>`;
  }
  cookieList += '<p><a href="/clear-cookies">Clear All Cookies</a>';
  cookieList += '<p><a href="/">Back to Home</a>';
  res.send(cookieList);
});

// Clear all cookies
app.get('/clear-cookies', function(req, res) {
  res.clearCookie('authenticated');
  res.send('All cookies cleared. <a href="/report-cookies">View Active Cookies</a> | <a href="/">Back to Home</a>');
});

// Start server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});

