// server.js
const express = require('express');
const app = express();
const port = 3000;

// In-memory chat history and pending response storage.
// (This state is ephemeral and will be lost if the server is restarted.)
let chatMessages = [];
let pendingAIResponse = null;  // Holds the first user message that follows an AI question

// Serve static files from the "public" folder
app.use(express.static('public'));
app.use(express.json());

// Endpoint to get all chat messages (used by the webpage to update chat history)
app.get('/chat', (req, res) => {
  res.json(chatMessages);
});

// Endpoint for posting a chat message (used by the webpage for user messages)
app.post('/chat', (req, res) => {
  const { sender, message } = req.body;
  if (!sender || !message) {
    return res.status(400).json({ error: 'Both sender and message are required.' });
  }
  
  // Add the new message to chat history.
  chatMessages.push({ sender, message });
  
  // If the new message is from the user and the immediately previous message was from AI,
  // and no answer has been recorded yet, store this as the pending response.
  if (sender === 'user' && chatMessages.length >= 2) {
    const previousMsg = chatMessages[chatMessages.length - 2];
    if (previousMsg.sender === 'ai' && pendingAIResponse === null) {
      pendingAIResponse = message;
    }
  }
  
  res.json({ success: true });
});

// API endpoint for an AI agent to post a question.
// The question will be added as an AI message.
app.post('/api/ai/question', (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required.' });
  }
  
  chatMessages.push({ sender: 'ai', message: question });
  pendingAIResponse = null; // Clear any previous pending answer
  res.json({ success: true });
});

// API endpoint for an AI agent to fetch the user's answer to its last question.
// Once fetched, the pending answer is cleared.
app.get('/api/ai/response', (req, res) => {
  if (pendingAIResponse) {
    const answer = pendingAIResponse;
    pendingAIResponse = null; // Clear after retrieving
    res.json({ answer });
  } else {
    res.json({ answer: null });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});

