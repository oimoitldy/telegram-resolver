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
        
        const html = response.data;
        const $ = cheerio.load(html);
        
        // Méthode 1 : meta tags (aperçu)
        const video = $('meta[property="og:video"]').attr('content');
        const image = $('meta[property="og:image"]').attr('content');
        
        // Méthode 2 : chercher le JSON initial dans le HTML
        let fileUrl = null;
        const scriptMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/);
        
        if (scriptMatch) {
            try {
                const data = JSON.parse(scriptMatch[1]);
                // Le fichier est souvent dans messagesById > attachments
                const messages = data.messagesById || {};
                const firstMsg = Object.values(messages)[0];
                if (firstMsg && firstMsg.content) {
                    const doc = firstMsg.content.document;
                    const photo = firstMsg.content.photo;
                    const vid = firstMsg.content.video;
                    
                    if (doc && doc.document) {
                        fileUrl = doc.document.url;
                    } else if (vid && vid.video) {
                        fileUrl = vid.video.url;
                    } else if (photo && photo.sizes) {
                        const biggest = photo.sizes[photo.sizes.length - 1];
                        fileUrl = biggest.photo.url;
                    }
                }
            } catch (e) {
                // parsing JSON échoué, on ignore
            }
        }
        
        res.json({ 
            video: video || null,
            image: image || null,
            file: fileUrl || null
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => res.send('OK'));

app.listen(process.env.PORT || 3000);
