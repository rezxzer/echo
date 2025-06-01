const express = require('express');
const path = require('path');
const app = express();

// Set port
const port = process.env.PORT || 3001;

// Serve static files from the root directory
app.use(express.static(__dirname));

// Handle all routes
app.get('*', (req, res) => {
    // Remove /echo/ from the path if it exists
    const cleanPath = req.path.replace(/^\/echo\//, '');
    
    // If the request is for a file that exists, serve it
    if (cleanPath.endsWith('.js') || cleanPath.endsWith('.css') || cleanPath.endsWith('.html')) {
        res.sendFile(path.join(__dirname, cleanPath));
    } else {
        // Otherwise, serve index.html
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
}); 