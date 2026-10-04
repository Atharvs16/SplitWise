const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const auth = require('./routes/auth.routes');

app.use(express.json());
app.use(cookieParser());
app.use('/auth', auth);

app.get('/', (req, res) => {
    res.send('Split with SplitWise!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});