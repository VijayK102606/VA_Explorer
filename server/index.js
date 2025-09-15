const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/upload');
const axios = require('axios');
require('dotenv').config();

const app = express();
const EPORT = process.env.PORT || 4000;
const REACTURL = process.env.REACT_URL;

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use('/api', uploadRoutes);

// Chatbot endpoint for LLM queries
app.post('/api/chatbot', async (req, res) => {
    const { question, entry } = req.body;
    if (!question || !entry) {
        return res.status(400).json({ error: 'Missing question or entry data.' });
    }
    try {
        // Prepare prompt for LLM
        const prompt = `Given the following Verbal Autopsy data: ${JSON.stringify(entry)}. Answer the user question: ${question} (Respond with HTML formatting, do not include any tildes or markdown formatting.)`;
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'google/gemma-3n-e2b-it:free',
                messages: [
                    { role: 'user', content: prompt }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('LLM response:', response.data.choices[0].message.content);
        let cleanText = response.data.choices?.[0]?.message?.content || 'No answer.';
        if (typeof cleanText === 'string') {
          cleanText = cleanText.replace(/```html\s*/gi, '').replace(/```/g, '');
        }
        res.json({ answer: cleanText });
        } catch (error) {
        console.error('Chatbot error:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Failed to get response from LLM.' });
    }
});

app.post('/api/chatbot-batch', async(req, res) => {
    const { question, entries } = req.body;
    if (!question || !entries || entries.length === 0) {
        return res.status(400).json({ error: "Missing question or entires."});
    }

    try {
        const prompt = `Given the following Verbal Autopsy data: ${JSON.stringify(entries)}. 
        Answer the user question: ${question} 
        (Respond with HTML formatting, do not include any tildes or markdown formatting.)`;
        
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'google/gemma-3n-e2b-it:free',
                messages: [
                    { role: 'user', content: prompt }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        let cleanText = response.data.choices?.[0]?.message?.content || 'No answer.';
        if (typeof cleanText === 'string') {
            cleanText = cleanText.replace(/```html\s*/gi, '').replace(/```/g, '');
        }

        res.json({ answer: cleanText });
    } catch (error) {
        console.error('Batch chatbot error:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Failed to get response from LLM.' });
    }
});

app.listen(EPORT, ()=> {
    console.log(`Address: http://localhost:${EPORT}`);
});