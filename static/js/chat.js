async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;

    const chatBody = document.querySelector('.chat-body');
    
    // Add user message
    appendMessage('user', message);

    // Clear and disable input
    input.value = '';
    input.disabled = true;
    document.querySelector('.chat-input button').disabled = true;

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            appendMessage('ai', data.response);
        } else {
            throw new Error(data.response || 'Failed to get response');
        }
    } catch (error) {
        appendMessage('ai error', 'Sorry, I\'m having trouble responding right now. Please try again later.');
        console.error('Chat error:', error);
    } finally {
        // Re-enable input
        input.disabled = false;
        document.querySelector('.chat-input button').disabled = false;
        input.focus();
    }
}

function appendMessage(type, content) {
    const chatBody = document.querySelector('.chat-body');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    
    // If content contains HTML (like <br>), use innerHTML, otherwise use textContent
    if (type === 'ai' && content.includes('<br>')) {
        bubbleDiv.innerHTML = content;
    } else {
        bubbleDiv.textContent = content;
    }
    
    messageDiv.appendChild(bubbleDiv);
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Add enter key support
document.getElementById('chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
