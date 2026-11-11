const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(express.json());

app.post('/resolve', async (req, res) => {
    const { url } = req.body;
    
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const video = $('meta[property="og:video"]').attr('content');
        const image = $('meta[property="og:image"]').attr('content');
        
        res.json({ 
            video: video || null,
            image: image || null
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => res.send('OK'));

app.listen(process.env.PORT || 3000);
