let currentSalary = 1000000;
let selectedStatus = 'resident';
let selectedRegime = 'new';
let taxData = {
    basicInfo: {},
    incomeDetails: {},
    capitalGains: [],
    deductions: {
        section80C: [],
        others: {}
    }
};

// Initialize the form
document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    loadDeductionSuggestions();
});

function initializeForm() {
    const taxpayerCategory = document.getElementById('taxpayerCategory');
    const age = document.getElementById('age');
    const financialYear = document.getElementById('financialYear');

    // Add change listeners
    taxpayerCategory.addEventListener('change', handleTaxpayerChange);
    age.addEventListener('change', handleTaxpayerChange);
    financialYear.addEventListener('change', handleTaxpayerChange);

    // Initialize salary slider and other inputs
    const inputs = document.querySelectorAll('input[type="number"], select');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            if (input.id === 'basicSalary') {
                currentSalary = Number(input.value) || 0;
            }
            calculateTax();
        });
    });
}

function updatePreviewCalculations() {
    collectFormData();
    // Show running total or preview calculations as user types
    calculateRunningTotal();
}

// ...existing code for UI event handlers and formatAmount function...

async function calculateTax() {
    try {
        // Collect form data without validation
        const formData = collectFormData(false);

        const payload = {
            income: currentSalary,
            regime: selectedRegime,
            age_category: document.getElementById('age')?.value || '0',
            deductions: selectedRegime === 'old' ? {
                section80C: formData?.deductions?.section80C?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0,
                section80D: 0,
                hra: Number(document.getElementById('hra')?.value) || 0
            } : {}
        };

        const response = await fetch('/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        displayTaxCalculation(data);
        updateRegimeComparison(data.regime_comparison);

    } catch (error) {
        console.error('Tax calculation error:', error);
        // Just clear the display without showing error
        document.getElementById('taxSummary').innerHTML = '';
    }
}

function collectFormData(validateRequired = false) {
    try {
        // Build tax data object with safe defaults
        return {
            basicInfo: {
                taxpayerCategory: document.getElementById('taxpayerCategory')?.value || '',
                financialYear: document.getElementById('financialYear')?.value || new Date().getFullYear().toString(),
                age: document.getElementById('age')?.value || '0',
                gender: document.querySelector('input[name="gender"]:checked')?.value || 'male'
            },
            incomeDetails: {
                basicSalary: currentSalary,
                hra: Number(document.getElementById('hra')?.value) || 0,
                rentalIncome: Number(document.getElementById('rentalIncome')?.value) || 0,
                interestIncome: Number(document.getElementById('interestIncome')?.value) || 0
            }
        };
    } catch (error) {
        console.error('Form data collection error:', error);
        return null;
    }
}

// ...existing code for UI update functions and event listeners
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

function collectFormData(validateRequired = true) {
    try {
        // Reset any existing error highlights
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        // Collect basic info with optional validation
        const taxpayerCategory = document.getElementById('taxpayerCategory');
        const financialYear = document.getElementById('financialYear');
        const age = document.getElementById('age');
        const gender = document.querySelector('input[name="gender"]:checked');
        const basicSalary = document.getElementById('basicSalary');

        if (validateRequired) {
            if (!taxpayerCategory?.value) throw new Error('Please select a Tax Payer Category');
            if (!financialYear?.value) throw new Error('Please select a Financial Year');
            if (!age?.value) throw new Error('Please enter your Age');
            if (!gender?.value) throw new Error('Please select your Gender');
            if (!basicSalary?.value) throw new Error('Please enter your Basic Salary');
        }

        // Update current salary
        currentSalary = Number(basicSalary?.value) || 0;

        // Build tax data object with safe defaults
        return {
            basicInfo: {
                taxpayerCategory: taxpayerCategory?.value || '',
                financialYear: financialYear?.value || new Date().getFullYear().toString(),
                age: age?.value || '0',
                gender: gender?.value || 'male'
            },
            incomeDetails: {
                basicSalary: currentSalary,
                hra: Number(document.getElementById('hra')?.value) || 0,
                rentalIncome: Number(document.getElementById('rentalIncome')?.value) || 0,
                interestIncome: Number(document.getElementById('interestIncome')?.value) || 0
            },
            // ...rest of the data collection remains same...
        };
    } catch (error) {
        if (validateRequired) {
            highlightErrorFields(error.message);
                throw error;
        }
        // Return partial data if validation is not required
        return null;
    }
}

function displayTaxCalculation(result) {
    const summaryHtml = `
        <div class="tax-calculation-summary">
            <h3>Tax Calculation Breakdown</h3>
            <div class="summary-section">
                <h4>Total Income: ${formatAmount(result.totalIncome)}</h4>
                <div class="breakdown">
                    ${result.incomeBreakdown.map(item => `
                        <div class="breakdown-item">
                            <span>${item.description}</span>
                            <span>${formatAmount(item.amount)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${result.deductionsBreakdown.length > 0 ? `
                <div class="summary-section">
                    <h4>Deductions Applied</h4>
                    <div class="breakdown">
                        ${result.deductionsBreakdown.map(item => `
                            <div class="breakdown-item deduction">
                                <span>${item.description}</span>
                                <span>-${formatAmount(item.amount)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="final-tax">
                <h3>Final Tax Payable: ${formatAmount(result.finalTax)}</h3>
            </div>
        </div>
    `;

    document.getElementById('taxSummary').innerHTML = summaryHtml;
}

async function getAIAdvice(taxData, calculationResult) {
    const response = await fetch('/tax-advice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            taxData,
            calculationResult
        })
    });

    return await response.json();
}

function displayAIAdvice(advice) {
    document.getElementById('aiAdvice').innerHTML = `
        <div class="ai-advice-content">
            <h3>AI Tax Advisor Suggestions</h3>
            <div class="advice-text">${advice.advice}</div>
        </div>
    `;
}

function showError(message) {
    // Implement error display logic
    alert(message);
}

function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function addCapitalGainEntry() {
    const container = document.getElementById('capitalGainsContainer');
    const entryId = `capitalGain_${Date.now()}`;

    const entryHtml = `
        <div class="capital-gain-entry" id="${entryId}">
            <select class="asset-type" required>
                <option value="">Select Asset Type</option>
                <option value="equity">Equity Shares</option>
                <option value="property">Property</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="other">Other</option>
            </select>
            <input type="number" placeholder="Purchase Price" required>
            <input type="date" placeholder="Purchase Date" required>
            <input type="number" placeholder="Sale Price" required>
            <input type="date" placeholder="Sale Date" required>
            <button type="button" onclick="removeEntry('${entryId}')" class="remove-btn">Remove</button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', entryHtml);
}

function add80CEntry() {
    const container = document.getElementById('section80CContainer');
    const entryId = `80c_${Date.now()}`;

    const entryHtml = `
        <div class="deduction-entry" id="${entryId}">
            <select class="investment-type" required>
                <option value="">Select Investment Type</option>
                <option value="ppf">PPF</option>
                <option value="elss">ELSS</option>
                <option value="insurance">Life Insurance Premium</option>
                <option value="other">Other</option>
            </select>
            <input type="number" placeholder="Amount" required>
            <button type="button" onclick="removeEntry('${entryId}')" class="remove-btn">Remove</button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', entryHtml);
}

function removeEntry(entryId) {
    document.getElementById(entryId).remove();
}

function calculateRunningTotal() {
    // Implement running total calculation logic
}

function calculateFinalTax() {
    if (!collectFormData()) {
        return; // Stop if data collection failed
    }

    // Show loading state
    document.getElementById('taxSummary').innerHTML = '<div class="loading">Calculating...</div>';

    fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(taxData)
    })
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                throw new Error(result.error);
            }
            displayTaxCalculation(result);
            return getAIAdvice(taxData, result);
        })
        .then(aiAdvice => {
            displayAIAdvice(aiAdvice);
        })
        .catch(error => {
            document.getElementById('taxSummary').innerHTML = `
                <div class="tax-error-message">
                    <h4>⚠️ Error</h4>
                    <p>${error.message}</p>
                    <div class="error-help">
                        Please check your inputs and try again.
                    </div>
                </div>
            `;
        });
}

// Restore slider functionality
function updateSalaryInputs(value) {
    const slider = document.getElementById('salarySlider');
    const input = document.getElementById('basicSalary');
    const display = document.getElementById('salaryDisplay');

    // Ensure value is a number and within bounds
    value = Math.min(Math.max(Number(value) || 0, 0), 10000000);
    currentSalary = value;

    // Update all form elements
    slider.value = value;
    input.value = value;

    // Format display value
    if (value >= 10000000) {
        display.textContent = `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
        display.textContent = `₹${(value / 100000).toFixed(1)} L`;
    } else {
        display.textContent = `₹${value.toLocaleString('en-IN')}`;
    }

    calculateTax();
}

// Update initialization
window.addEventListener('DOMContentLoaded', function () {
    const slider = document.getElementById('salarySlider');
    const basicSalary = document.getElementById('basicSalary');

    if (slider) {
        slider.addEventListener('input', function (e) {
            updateSalaryInputs(e.target.value);
        });
    }

    if (basicSalary) {
        basicSalary.addEventListener('input', function (e) {
            updateSalaryInputs(e.target.value);
        });
        basicSalary.addEventListener('change', calculateTax);
    }

    // Initial setup
    updateSalaryInputs(currentSalary);
    selectStatus('resident');
    handleTaxpayerChange();
    selectRegime('new');
});

async function loadDeductionSuggestions() {
    try {
        const response = await fetch('/deduction-suggestions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                income: currentSalary,
                profession: document.getElementById('taxpayerCategory').value,
                age: document.getElementById('age').value
            })
        });

        const suggestions = await response.json();
        displayDeductionSuggestions(suggestions);
    } catch (error) {
        console.error('Error loading deduction suggestions:', error);
        document.getElementById('aiDeductionSuggestions').innerHTML =
            '<div class="error-message">Unable to load suggestions at the moment.</div>';
    }
}

function displayDeductionSuggestions(suggestions) {
    const container = document.getElementById('aiDeductionSuggestions');
    container.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-card">
            <div class="suggestion-title">${suggestion.title}</div>
            <div class="suggestion-description">${suggestion.description}</div>
            <div class="suggestion-amount">Maximum deduction: ${formatAmount(suggestion.maxAmount)}</div>
            <button class="apply-suggestion" 
                onclick="applyDeductionSuggestion(${JSON.stringify(suggestion).replace(/"/g, '&quot;')})">
                Apply
            </button>
        </div>
    `).join('');
}

function applyDeductionSuggestion(suggestion) {
    addOtherDeduction(suggestion.title, suggestion.section, suggestion.maxAmount);
}

function addOtherDeduction(title = '', section = '', maxAmount = 0) {
    const container = document.getElementById('otherDeductionsContainer');
    const entryId = `deduction_${Date.now()}`;

    const entryHtml = `
        <div class="deduction-entry" id="${entryId}">
            <input type="text" class="deduction-title" 
                placeholder="Deduction Name" 
                value="${title}" 
                ${title ? 'readonly' : ''}>
            <input type="text" class="deduction-section" 
                placeholder="Section Number" 
                value="${section}"
                ${section ? 'readonly' : ''}>
            <input type="number" 
                placeholder="Amount" 
                max="${maxAmount || ''}" 
                required>
            <button type="button" onclick="removeEntry('${entryId}')" class="remove-btn">Remove</button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', entryHtml);
}

function handleTaxpayerChange() {
    const category = document.getElementById('taxpayerCategory').value;
    const age = document.getElementById('age').value;
    const financialYear = document.getElementById('financialYear').value;

    // Set initial salary based on category and age
    let initialSalary = 1000000; // Default 10L

    if (category === 'individual') {
        if (age < 30) {
            initialSalary = 500000; // 5L for young professionals
        } else if (age < 50) {
            initialSalary = 1000000; // 10L for mid-career
        } else {
            initialSalary = 1500000; // 15L for seniors
        }
    } else if (category === 'domestic' || category === 'foreign') {
        initialSalary = 5000000; // 50L for companies
    } else if (category === 'firm' || category === 'llp') {
        initialSalary = 2000000; // 20L for firms/LLPs
    }

    // Update salary inputs
    updateSalaryInputs(initialSalary);
}
