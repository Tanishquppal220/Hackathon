const timelineData = [
    {
        name: 'April 2024',
        events: [
            { date: '15 Apr', label: 'Advance Tax Due', status: 'due' },
            { date: '30 Apr', label: 'Form 24Q Filing', status: 'upcoming' }
        ]
    },
    {
        name: 'May 2024',
        events: [
            { date: '7 May', label: 'TDS Payment', status: 'upcoming' },
            { date: '31 May', label: 'ITR Filing Opens', status: 'upcoming' }
        ]
    },
    {
        name: 'June 2024',
        events: [
            { date: '15 Jun', label: 'First Quarter Advance Tax', status: 'upcoming' },
            { date: '30 Jun', label: 'TDS Certificate Issue', status: 'upcoming' }
        ]
    }
];

let lastScroll = 0;
const navbar = document.querySelector('nav');
const scrollThreshold = 100; // minimum scroll before navbar hides

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Show navbar when scrolling up or at the top
    if (currentScroll <= scrollThreshold) {
        navbar.classList.remove('hide');
    } else if (currentScroll > lastScroll) {
    // Scrolling down - hide navbar
        navbar.classList.add('hide');
    } else {
        // Scrolling up - show navbar
        navbar.classList.remove('hide');
    }

    lastScroll = currentScroll;
});

// Timeline Navigation
const MONTHS_PER_PAGE = 3;
let currentPage = 0;
const totalPages = Math.ceil(timelineData.length / MONTHS_PER_PAGE);
let currentFY = 'FY2024-25';
let currentQuarter = 'Q1';
const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

function renderTimeline() {
    const startIndex = currentPage * MONTHS_PER_PAGE;
    const visibleMonths = timelineData.slice(startIndex, startIndex + MONTHS_PER_PAGE);
    const firstMonth = timelineData[startIndex].name;
    const lastMonth = timelineData[Math.min(startIndex + 2, timelineData.length - 1)].name;

    document.querySelector('.current-period').textContent = `${firstMonth.split(' ')[0]} - ${lastMonth.split(' ')[0]}`;

    const timeline = document.querySelector('.timeline-grid');
    timeline.innerHTML = visibleMonths.map(month => `
        <div class="month-card">
            <div class="month-header">
                <h3>${month.name}</h3>
            </div>
            <div class="month-events">
                ${month.events.map(event => `
                    <div class="event ${event.status}">
                        <span class="event-date">${event.date}</span>
                        <span class="event-label">${event.label}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

document.querySelectorAll('.quarter-nav').forEach(button => {
    button.addEventListener('click', (e) => {
        const direction = e.target.dataset.quarter;
        const currentIndex = quarters.indexOf(currentQuarter);

        if (direction === 'prev' && currentIndex > 0) {
            currentQuarter = quarters[currentIndex - 1];
        } else if (direction === 'next' && currentIndex < quarters.length - 1) {
            currentQuarter = quarters[currentIndex + 1];
        }

        updateTimeline(currentFY, currentQuarter);
    });
});

// FY Navigation
document.querySelectorAll('.fy-nav').forEach(button => {
    button.addEventListener('click', () => {
        currentFY = button.dataset.fy;
        updateTimeline(currentFY, currentQuarter);
    });
});

// Initialize timeline
document.addEventListener('DOMContentLoaded', () => {
    renderTimeline();

    document.querySelectorAll('.month-nav').forEach(button => {
        button.addEventListener('click', (e) => {
            const direction = e.target.dataset.nav;

            if (direction === 'prev' && currentPage > 0) {
                currentPage--;
            } else if (direction === 'next' && currentPage < totalPages - 1) {
                currentPage++;
            }

            renderTimeline();
        });
    });
});

// AI Chat Functionality
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to chat
    addMessage(message, 'user');
    input.value = '';

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();

        // Add AI response to chat
        addMessage(data.response, 'ai');
    } catch (error) {
        console.error('Error:', error);
        addMessage("Sorry, I'm having trouble connecting right now.", 'ai');
    }
}

function addMessage(text, sender) {
    const chatBody = document.querySelector('.chat-body');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.innerHTML = `
        <div class="message-bubble">
            ${text}
        </div>
    `;

    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Add event listener for Enter key in chat input
document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
