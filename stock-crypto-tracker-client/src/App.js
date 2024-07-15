import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
    const [symbol, setSymbol] = useState('GOOG');
    const [prices, setPrices] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/prices/${symbol}`);
                setPrices(response.data);
            } catch (error) {
                console.error('Error fetching prices:', error);
            }
        };
        
        // Fetch prices for the default symbol on initial load
        fetchPrices();

        // Setup interval to fetch prices every 5 seconds
        const intervalId = setInterval(fetchPrices, 1000);

        // Cleanup function to clear the interval
        return () => clearInterval(intervalId);
    }, [symbol]);

    const handleSymbolChange = (newSymbol) => {
        setSymbol(newSymbol);
        setIsModalOpen(false);
    };

    return (
        <div className="container">
            <h1 className="mt-5 mb-4">Real-Time Price Tracker</h1>
            <div className="mb-3">
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Change Symbol</button>
                <span className="ms-3 fw-bold">Selected Symbol: {symbol}</span>
            </div>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {prices.map((price) => (
                        <tr key={price._id}>
                            <td>{new Date(price.timestamp).toLocaleString()}</td>
                            <td>{price.price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {isModalOpen && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Select Symbol</h5>
                                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
                            </div>
                            <div className="modal-body">
                                {['GOOG', 'BTC', 'ETH', 'AAPL', 'AMZN'].map((sym) => (
                                    <button key={sym} className="btn btn-secondary m-2" onClick={() => handleSymbolChange(sym)}>
                                        {sym}
                                    </button>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
