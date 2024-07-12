const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const tasks = require('./routes/tasks');

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());


// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/todo-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/tasks', tasks);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
