const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const auth = require('./routes/auth.routes');
const groups = require('./routes/groups.routes');
const friends = require('./routes/friends.routes');
const activity = require('./routes/activity.routes');
const users = require('./routes/users.routes');
const cors = require("cors");

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', auth);
app.use('/api/groups', groups);
app.use('/api/friends', friends);
app.use('/api/activity', activity);
app.use('/api/users', users);

app.use(cors({
    origin: ["http://localhost:5173",
        "https://splits-ease.vercel.app"
    ],
    credentials: true
}));

app.get('/', (req, res) => {
    res.send('Split with SplitWise!');
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});