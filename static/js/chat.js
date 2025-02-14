async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message to chat
    const chatBody = document.querySelector('.chat-body');
    const userMessage = `
        <div class="chat-message user">
            <div class="message-bubble">
                ${message}
            </div>
        </div>
    `;
    chatBody.insertAdjacentHTML('beforeend', userMessage);

    // Clear input and disable it while waiting
    input.value = '';
    input.disabled = true;
    const sendButton = document.querySelector('.chat-input button');
    sendButton.disabled = true;

    try {
        // Call the backend API
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        
        const aiResponse = `
            <div class="chat-message ai">
                <div class="message-bubble">
                    ${data.response}
                </div>
            </div>
        `;
        chatBody.insertAdjacentHTML('beforeend', aiResponse);
        chatBody.scrollTop = chatBody.scrollHeight;
    } catch (error) {
        // Handle error
        const errorMessage = `
            <div class="chat-message ai error">
                <div class="message-bubble">
                    Sorry, I'm having trouble responding right now. Please try again later.
                </div>
            </div>
        `;
        chatBody.insertAdjacentHTML('beforeend', errorMessage);
    } finally {
        // Re-enable input and button
        input.disabled = false;
        sendButton.disabled = false;
        input.focus();
    }
}

// Add enter key support
document.getElementById('chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
