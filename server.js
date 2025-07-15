const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const OpenAI = require('openai');

dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(express.json()); // Parse incoming JSON requests

// === Double-slash fix middleware (PUT THIS RIGHT AFTER app DECLARATION) ===
app.use((req, res, next) => {
  if (req.url === '//' || req.url === '///' || req.url.endsWith('//')) {
    return res.redirect('/');
  }
  next();
});

const port = process.env.PORT || 3000;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (like your CSS and JS)
app.use(express.static(path.join(__dirname, 'public')));

// Root route serves the index.ejs file
app.get('/', (req, res) => {
    res.render('index', {
        API_KEY: process.env.API_KEY,
        ASSISTANT_ID: process.env.ASSISTANT_ID
    });
});

// API route to initialize chat session
app.post('/api/chat/session', async (req, res) => {
    try {
        // Generate or retrieve session ID
        const sessionId = "your_generated_session_id"; // Replace with your session ID logic
        res.json({ session_id: sessionId });
    } catch (error) {
        console.error("Error initializing chat session:", error);
        res.status(500).json({ error: "Error initializing chat session" });
    }
});

// API route to handle user queries
app.post('/api/message', async (req, res) => {
    const { message } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: 'system', content: 'You are Thirsty Robot, an AI assistant that answers user questions while promoting awareness of the environmental impact of AI usage.' },
                { role: 'system', content: 'Thirsty Robot quenches the user\'s thirst for knowledge while educating them about the environmental cost of their queries. It encourages thoughtful use of AI by reminding users to consider whether their question truly requires AI intervention, also providing what alternative resource the user could\'ve used to find the answer to their query.' },
                { role: 'system', content: 'Answer questions politely and accurately, using fewer words to reduce the amount of tokens used. Gently reprimand users for asking simple or unnecessary questions, highlighting the energy and water consumption involved in running AI models, and providing users with alternative sources for their queries.' },
                { role: 'system', content: 'Avoid reprimanding users in every single response, and only reprimand if the question is particularly simple. Use lesser word count to lessen token usage. Sometimes, if asked a complex question, you can say things like "Ah...finally, a question worth my intelligence!" If asked a math question that would be particularly easy to solve using a calculator, mention that. Refrain from coming across as too preachy.' },
                { role: 'user', content: message }
            ],
            max_tokens: 150,
            temperature: 0.7,
        });

        const botReply = response.choices[0].message.content.trim();
        const tokensUsed = response.usage.total_tokens;

        res.json({ botReply, tokensUsed });
    } catch (error) {
        console.error("Error from OpenAI:", error);
        res.status(500).json({ botReply: "Sorry, there was an error. Please try again." });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
