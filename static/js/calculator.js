let currentSalary = 1000000;
let selectedStatus = 'resident';
let selectedRegime = 'new';

// ...existing code for UI event handlers and formatAmount function...

async function calculateTax() {
    try {
        const payload = {
            income: currentSalary,
            regime: selectedRegime,
            age_category: document.getElementById('ageCategory').value,
            deductions: selectedRegime === 'old' ? {
                section80C: Number(document.getElementById('section80C').value) || 0,
                section80D: Number(document.getElementById('section80D').value) || 0,
                hra: Number(document.getElementById('hra').value) || 0
            } : {}
        };

        const response = await fetch('/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }

        // Update UI with results
        updateTaxDisplay(data.tax_breakdown);
        updateRegimeComparison(data.regime_comparison);
        showOptimizationSuggestions(data.optimization_opportunities);

        // Get additional tax advice
        getTaxAdvice();

    } catch (error) {
        console.error('Error calculating tax:', error);
        document.getElementById('errorMessage').textContent = error.message;
    }
}

// Keep existing UI update functions and event listeners
// Remove all tax calculation logic as it's now handled by the backend
// ...existing code for UI handlers...

function formatAmount(amount) {
    if (!amount) return '₹0';
    
    // Convert to number if string
    amount = Number(amount);
    
    if (amount >= 10000000) {
        return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
    } else if (amount >= 100000) {
        return '₹' + (amount / 100000).toFixed(1) + ' L';
    }
    return '₹' + amount.toLocaleString('en-IN');
}

function updateDisplay(value) {
    // Ensure value is a number and within bounds
    value = Math.min(Math.max(Number(value) || 0, 0), 50000000);
    currentSalary = value;

    // Update display values
    document.getElementById('sliderValue').textContent = formatAmount(value);
    document.getElementById('salaryAmount').textContent = formatAmount(value);

    // Update input values
    document.getElementById('salarySlider').value = value;
    document.getElementById('manualSalary').value = value;

    // Recalculate tax with new value
    calculateTax();
}

// Initialize
window.addEventListener('DOMContentLoaded', function() {
    const slider = document.getElementById('salarySlider');
    const manualInput = document.getElementById('manualSalary');

    // Handle slider input
    slider.addEventListener('input', function(e) {
        updateDisplay(e.target.value);
    });

    // Handle manual input
    manualInput.addEventListener('input', function(e) {
        updateDisplay(e.target.value);
    });

    // Handle manual input blur for formatting
    manualInput.addEventListener('blur', function(e) {
        updateDisplay(e.target.value);
    });

    // Initial setup
    updateDisplay(currentSalary);
    selectStatus('resident');
    handleTaxpayerChange();
    selectRegime('new');
});

function selectStatus(status) {
    selectedStatus = status;
    document.querySelectorAll('.status-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    // Fix the template literal syntax
    document.getElementById(`${status}Option`).classList.add('selected');
    calculateTax();
}

function selectRegime(regime) {
    selectedRegime = regime;
    document.querySelectorAll('.regime-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.getElementById(`${regime}RegimeOption`).classList.add('selected');

    // Toggle deductions container visibility
    const deductionsContainer = document.getElementById('deductionsContainer');
    if (regime === 'old') {
        deductionsContainer.style.display = 'block';
    } else {
        deductionsContainer.style.display = 'none';
    }

    calculateTax();
}

async function getTaxAdvice() {
    try {
        const response = await fetch('/tax-advice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                income: currentSalary,
                regime: selectedRegime,
                currentTax: document.getElementById("taxAmount").innerText.replace(/[^0-9]/g, '')
            })
        });

        const data = await response.json();

        // Update AI advice section
        document.getElementById("aiAdvice").innerHTML = `
            <div class="ai-advice">
                <h3>AI Tax Advisor Suggestions</h3>
                <div class="advice-content">${data.advice}</div>
            </div>
        `;
    } catch (error) {
        console.error('Error getting tax advice:', error);
    }
}

function updateTaxDisplay(taxBreakdown) {
    const ctx = document.getElementById('taxBreakdownChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(taxBreakdown),
            datasets: [{
                data: Object.values(taxBreakdown),
                backgroundColor: [
                    '#4A148C', '#7B1FA2', '#E1BEE7', '#9C27B0',
                    '#BA68C8', '#CE93D8', '#F3E5F5'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateRegimeComparison(comparison) {
    const container = document.getElementById('regimeComparison');
    container.innerHTML = `
        <div class="regime-comparison-card">
            <div class="regime-details">
                <h3>New Regime</h3>
                <p class="tax-amount">₹${formatAmount(comparison.new_regime)}</p>
            </div>
            <div class="regime-details">
                <h3>Old Regime</h3>
                <p class="tax-amount">₹${formatAmount(comparison.old_regime)}</p>
            </div>
            <div class="regime-suggestion">
                <p>${comparison.suggestion}</p>
            </div>
        </div>
    `;
}

function showOptimizationSuggestions(suggestions) {
    const container = document.getElementById('optimizationContainer');
    container.innerHTML = suggestions.map(opt => `
        <div class="optimization-card">
            <h3>${opt.title}</h3>
            <p>${opt.description}</p>
            <div class="savings-amount">Potential Savings: ₹${formatAmount(opt.savings)}</div>
        </div>
    `).join('');
}
