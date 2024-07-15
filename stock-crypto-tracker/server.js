const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const priceSchema = new mongoose.Schema({
    symbol: String,
    price: Number,
    timestamp: { type: Date, default: Date.now }
});

const Price = mongoose.model('Price', priceSchema);

const API_URLS = {
    'GOOG': `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=GOOG&interval=1min&apikey=${process.env.API_KEY}`,
    'BTC': `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`,
    'ETH': `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`,
    'AAPL': `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=AAPL&interval=1min&apikey=${process.env.API_KEY}`,
    'AMZN': `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=AMZN&interval=1min&apikey=${process.env.API_KEY}`
};

const SYMBOLS = ['GOOG', 'BTC', 'ETH', 'AAPL', 'AMZN'];

async function fetchAndStoreData() {
    try {
        for (let symbol of SYMBOLS) {
            const url = API_URLS[symbol];
            console.log(`Fetching data for ${symbol} from ${url}`);
            const response = await axios.get(url);
            console.log(`Response for ${symbol}:`, response.data);

            let price;
            if (symbol === 'BTC') {
                if (response.data.bitcoin && response.data.bitcoin.usd) {
                    price = response.data.bitcoin.usd;
                } else {
                    console.error(`Invalid response for ${symbol}:`, response.data);
                    continue;
                }
            } else if (symbol === 'ETH') {
                if (response.data.ethereum && response.data.ethereum.usd) {
                    price = response.data.ethereum.usd;
                } else {
                    console.error(`Invalid response for ${symbol}:`, response.data);
                    continue;
                }
            } else {
                if (response.data['Time Series (1min)']) {
                    const timeSeries = response.data['Time Series (1min)'];
                    const latestTime = Object.keys(timeSeries)[0];
                    price = timeSeries[latestTime]['1. open'];
                } else {
                    console.error(`Invalid response for ${symbol}:`, response.data);
                    continue;
                }
            }

            console.log(`Parsed price for ${symbol}: ${price}`);

            const priceData = {
                symbol,
                price: parseFloat(price)
            };
            const result = await Price.create(priceData);
            console.log(`Stored in DB:`, result);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

cron.schedule('*/1 * * * *', () => {
    console.log('Fetching data...');
    fetchAndStoreData();
});

app.get('/prices/:symbol', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const prices = await Price.find({ symbol }).sort({ timestamp: -1 }).limit(20);
    res.json(prices);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
