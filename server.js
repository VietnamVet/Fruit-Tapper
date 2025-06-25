
const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const publicVapidKey = 'BIkxk5nY7k7ZcA9tH7fLbUFXGhIuL6jv5CkyLw1I7RYE4wM8dijMopnYj3r_sVX2sExnp7gtV6wRQF5T6bE3IOM';
const privateVapidKey = 'L_QP38QGffSSOs7Ba3xjS8nX12tiPiAr6NYJq0oYqQQ'; // Replace with your own private key!

webpush.setVapidDetails(
  'mailto:your@email.com',
  publicVapidKey,
  privateVapidKey
);

let subscriptions = []; // In-memory; use DB for production

app.post('/api/save-subscription', (req, res) => {
  const sub = req.body;
  if (!subscriptions.find(s => s.endpoint === sub.endpoint)) {
    subscriptions.push(sub);
  }
  res.status(201).json({});
});

app.get('/api/notify', async (req, res) => {
  const payload = JSON.stringify({
    title: "🍏 Come back to Fruit Tapper!",
    body: "Your farm is ready to harvest! Tap now for rewards.",
    url: "/"
  });
  const failed = [];
  await Promise.all(subscriptions.map(sub =>
    webpush.sendNotification(sub, payload).catch(err => failed.push(sub))
  ));
  subscriptions = subscriptions.filter(sub => !failed.includes(sub));
  res.send('Push sent!');
});

app.listen(3000, () => console.log('Server started on port 3000'));
