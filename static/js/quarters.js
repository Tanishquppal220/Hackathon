const timelineData = [
    {
        name: 'April 2024',
        events: [
            { date: '07 Apr', label: 'New FY Begins', status: 'upcoming' },
            { date: '30 Apr', label: 'Investment Declaration', status: 'upcoming' }
        ]
    },
    {
        name: 'May 2024',
        events: [
            { date: '15 May', label: 'Form 16 Submission', status: 'upcoming' }
        ]
    },
    {
        name: 'June 2024',
        events: [
            { date: '15 Jun', label: 'Q1 Advance Tax', status: 'upcoming' }
        ]
    },
    {
        name: 'July 2024',
        events: [
            { date: '31 Jul', label: 'ITR Filing (Non-Audit)', status: 'upcoming' }
        ]
    },
    {
        name: 'August 2024',
        events: [
            { date: '15 Aug', label: 'HRA Proofs', status: 'upcoming' }
        ]
    },
    {
        name: 'September 2024',
        events: [
            { date: '15 Sep', label: 'Q2 Advance Tax', status: 'upcoming' }
        ]
    },
    {
        name: 'October 2024',
        events: [
            { date: '15 Oct', label: 'Q3 Planning', status: 'upcoming' }
        ]
    },
    {
        name: 'November 2024',
        events: [
            { date: '30 Nov', label: '80C Planning', status: 'upcoming' }
        ]
    },
    {
        name: 'December 2024',
        events: [
            { date: '15 Dec', label: 'Q3 Advance Tax', status: 'upcoming' }
        ]
    },
    {
        name: 'January 2025',
        events: [
            { date: '31 Jan', label: 'Investment Deadline', status: 'upcoming' }
        ]
    },
    {
        name: 'February 2025',
        events: [
            { date: '28 Feb', label: 'Proof Submission', status: 'upcoming' }
        ]
    },
    {
        name: 'March 2025',
        events: [
            { date: '15 Mar', label: 'Q4 Advance Tax', status: 'upcoming' },
            { date: '31 Mar', label: 'FY End', status: 'upcoming' }
        ]
    }
];

const quarters = {
    'Q1': {
        name: 'April - June',
        months: [
            {
                name: 'April',
                events: [
                    { date: '7', label: 'TDS Payment Due', status: 'due' },
                    { date: '15', label: 'Advance Tax Q1', status: 'upcoming' },
                    { date: '30', label: 'ITR Filing Starts', status: 'completed' }
                ]
            },
            {
                name: 'May',
                events: [
                    { date: '7', label: 'TDS Payment Due', status: 'due' },
                    { date: '31', label: 'PF Statement Filing', status: 'pending' }
                ]
            },
            {
                name: 'June',
                events: [
                    { date: '7', label: 'TDS Payment Due', status: 'upcoming' },
                    { date: '15', label: 'Q1 Advance Tax Due', status: 'due' },
                    { date: '30', label: 'Form 16 Due Date', status: 'upcoming' }
                ]
            }
        ]
    },
    'Q2': {
        name: 'July - September',
        months: [
            {
                name: 'July',
                events: [
                    { date: '7', label: 'TDS Payment Due', status: 'upcoming' },
                    { date: '31', label: 'ITR Filing Last Date', status: 'due' }
                ]
            },
            {
                name: 'August',
                events: [
                    { date: '7', label: 'TDS Payment Due', status: 'upcoming' },
                    { date: '15', label: 'Form 16A Issue', status: 'pending' }
                ]
            },
            {
                name: 'September',
                events: [
                    { date: '7', label: 'TDS Payment Due', status: 'upcoming' },
                    { date: '15', label: 'Q2 Advance Tax Due', status: 'upcoming' }
                ]
            }
        ]
    },
    'Q3': {
        name: 'October - December',
        months: [
            {
                name: 'October',
                events: [
                    { date: '7', label: 'TDS Payment Due', status: 'upcoming' },
                    { date: '15', label: 'Tax Planning Review', status: 'pending' },
                    { date: '31', label: '80C Investment Planning', status: 'upcoming' }
                ]
            },
            {
                name: 'November',
                events: [
                    { date: '7', label: 'TDS Payment Due', status: 'upcoming' },
                    { date: '30', label: 'Investment Declarations', status: 'pending' }
                ]
            },
            {
                name: 'December',
                events: [
                    { date: '7', label: 'TDS Payment Due', status: 'upcoming' },
                    { date: '15', label: 'Q3 Advance Tax Due', status: 'due' },
                    { date: '31', label: 'Tax Saving Deadline', status: 'upcoming' }
                ]
            }
        ]
    },
    'Q4': {
        name: 'January - March',
        months: [
            {
                name: 'January',
                events: [
                    { date: '7', label: 'TDS Payment Due', status: 'upcoming' },
                    { date: '31', label: 'Investment Proof Submission', status: 'due' }
                ]
            },
            {
                name: 'February',
                events: [
                    { date: '7', label: 'TDS Payment Due', status: 'upcoming' },
                    { date: '28', label: 'Last Investment Date', status: 'pending' }
                ]
            },
            {
                name: 'March',
                events: [
                    { date: '7', label: 'TDS Payment Due', status: 'upcoming' },
                    { date: '15', label: 'Q4 Advance Tax Due', status: 'due' },
                    { date: '31', label: 'Financial Year End', status: 'upcoming' }
                ]
            }
        ]
    }
};

let currentQuarter = 'Q1';

function renderTimeline(quarterData) {
    const timelineGrid = document.querySelector('.timeline-grid');
    const periodLabel = document.querySelector('.current-period');

    if (!timelineGrid || !periodLabel) return;

    // Update period label
    periodLabel.textContent = quarterData.name;

    // Clear existing content
    timelineGrid.innerHTML = '';

    // Render months
    quarterData.months.forEach(month => {
        const monthCard = `
            <div class="month-card ${month.name === getCurrentMonth() ? 'current' : ''}">
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
        `;
        timelineGrid.insertAdjacentHTML('beforeend', monthCard);
    });
}

function getCurrentMonth() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return months[new Date().getMonth()];
}

function navigateQuarter(direction) {
    const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4'];
    const currentIndex = quarterOrder.indexOf(currentQuarter);
    
    if (direction === 'next' && currentIndex < quarterOrder.length - 1) {
        currentQuarter = quarterOrder[currentIndex + 1];
    } else if (direction === 'prev' && currentIndex > 0) {
        currentQuarter = quarterOrder[currentIndex - 1];
    }
    renderTimeline(quarters[currentQuarter]);
}

// Initialize timeline
document.addEventListener('DOMContentLoaded', () => {
    renderTimeline(quarters[currentQuarter]);

    // Add navigation handlers
    const navButtons = document.querySelectorAll('.month-nav');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navigateQuarter(button.dataset.nav);
        });
    });
});
