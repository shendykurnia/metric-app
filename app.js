const express = require('express');
const app = express();
const port = 3000;
const metric = require('./app/metric');

app.use(express.json());

app.post('/metric/:key', (req, res) => {
    const { key } = req.params;
    const { value } = req.body;

    // validate input
    if (value === undefined || isNaN(value)) {
        res.sendStatus(422);
        return;
    }

    const success = metric.record(key, value);
    if (!success) {
        res.sendStatus(500);
        return;
    }

    res.status(200).json({});
});

app.get('/metric/:key/sum', (req, res) => {
    const { key } = req.params;

    const value = metric.sum(key);

    res.status(200).json({ value });
});

if (!process.env.testing) {
    app.listen(port, () => console.log(`Listening at port ${port}`));
}

module.exports = app;
