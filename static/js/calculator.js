const taxSlabs = {
    newRegime: {
        slabs: [
            { min: 0, max: 400000, rate: 0 },
            { min: 400001, max: 800000, rate: 5 },
            { min: 800001, max: 1200000, rate: 10 },
            { min: 1200001, max: 1600000, rate: 15 },
            { min: 1600001, max: 2000000, rate: 20 },
            { min: 2000001, max: 2400000, rate: 25 },
            { min: 2400001, max: Infinity, rate: 30 }
        ],
        standardDeduction: 75000,
        rebate: {
            maxIncome: 1200000,
            amount: 60000
        }
    },
    oldRegime: {
        slabs: [
            { min: 0, max: 250000, rate: 0 },
            { min: 250001, max: 500000, rate: 5 },
            { min: 500001, max: 1000000, rate: 20 },
            { min: 1000001, max: Infinity, rate: 30 }
        ],
        standardDeduction: 50000,
        deductions: {
            section80C: 150000,
            section80D: 25000,
            hra: 0
        }
    }
};

let currentSalary = 1000000;
let selectedStatus = 'resident';
let selectedRegime = 'new';

function calculateHRA(basicSalary, rentPaid, isMetro, actualHRA) {
    if (!basicSalary || !rentPaid) return 0;

    const metroPercent = isMetro ? 0.5 : 0.4;
    const basicPercent = basicSalary * metroPercent;
    const rentMinusBasic = rentPaid - (basicSalary * 0.1);

    return Math.min(
        actualHRA || (basicSalary * 0.4), // Default HRA is 40% of basic if not provided
        basicPercent,
        rentMinusBasic
    );
}

function calculateDeductions(income, rentPaid = 0, basicSalary = 0, isMetro = true) {
    const deductions = {
        section80C: 150000,
        section80D: 25000,
        HRA: 0
    };

    // Auto Section 80C Optimization
    deductions.section80C = Math.min(150000, income);

    // Calculate HRA based on the formula
    const actualHRA = basicSalary * 0.4; // Assuming 40% of basic as HRA
    deductions.HRA = calculateHRA(basicSalary, rentPaid * 12, isMetro, actualHRA);
    
    // Adjust section80D for senior citizens
    const ageCategory = document.getElementById('ageCategory')?.value;
    deductions.section80D = (ageCategory === 'senior' || ageCategory === 'super-senior') ? 50000 : 25000;

    return deductions;
}

function calculateTaxableIncome(income, regime) {
    // First apply standard deduction
    let taxableIncome = income;
    let standardDeduction = regime === taxSlabs.newRegime ? 75000 : 50000;
    taxableIncome -= standardDeduction;

    // Apply deductions only for old regime
    if (regime === taxSlabs.oldRegime) {
        try {
            const rentPaid = Number(document.getElementById('rentPaid')?.value) || 0;
            const basicSalary = Number(document.getElementById('basicSalary')?.value) || 0;
            const isMetro = document.getElementById('isMetroCity')?.checked || false;

            const deductions = calculateDeductions(income, rentPaid, basicSalary, isMetro);
            
            // Log deductions for debugging
            console.log('Calculating deductions:', {
                income,
                standardDeduction,
                section80C: deductions.section80C,
                section80D: deductions.section80D,
                HRA: deductions.HRA
            });

            // Apply all eligible deductions
            taxableIncome = income 
                - standardDeduction
                - deductions.section80C 
                - deductions.section80D 
                - deductions.HRA;

            // Show deductions breakdown
            document.getElementById('deductionsBreakdown').innerHTML = `
                <div class="deductions-summary">
                    <p>Gross Income: ${formatAmount(income)}</p>
                    <p>Standard Deduction: -${formatAmount(standardDeduction)}</p>
                    <p>Section 80C: -${formatAmount(deductions.section80C)}</p>
                    <p>Section 80D: -${formatAmount(deductions.section80D)}</p>
                    <p>HRA Exemption: -${formatAmount(deductions.HRA)}</p>
                    <p class="total">Taxable Income: ${formatAmount(taxableIncome)}</p>
                </div>
            `;
        } catch (error) {
            console.error('Error calculating deductions:', error);
        }
    } else {
        // For new regime, only show standard deduction
        document.getElementById('deductionsBreakdown').innerHTML = `
            <div class="deductions-summary">
                <p>Gross Income: ${formatAmount(income)}</p>
                <p>Standard Deduction: -${formatAmount(standardDeduction)}</p>
                <p class="total">Taxable Income: ${formatAmount(taxableIncome)}</p>
            </div>
        `;
    }

    return Math.max(0, taxableIncome); // Ensure taxable income is not negative
}

function calculateTaxForSlabs(income, regime) {
    // Calculate taxable income first
    const taxableIncome = calculateTaxableIncome(income, regime);
    let tax = 0;

    // Calculate tax based on slabs
    for (const slab of regime.slabs) {
        if (taxableIncome > slab.min) {
            const slabAmount = Math.min(taxableIncome - slab.min, slab.max - slab.min);
            tax += (slabAmount * slab.rate) / 100;
        }
    }

    // Apply rebate for new regime
    if (regime === taxSlabs.newRegime && taxableIncome <= regime.rebate.maxIncome) {
        tax = Math.max(0, tax - regime.rebate.amount);
    }

    return { tax, taxableIncome };
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

function showCalculationSteps(income, deductions, finalTax) {
    const breakdownDiv = document.getElementById('deductionsBreakdown');
    let html = '<div class="calculation-container"><div class="calculation-header">Tax Calculation Breakdown</div>';
    
    // Hide the optimized deductions section
    document.querySelector('.calculated-deductions').classList.add('hidden');
    
    // Show gross income
    html += `
        <div class="calculation-step addition">
            <div>
                <span class="operator"></span>
                <span class="step-label">Gross Income</span>
            </div>
            <span class="amount-change">${formatAmount(income)}</span>
        </div>
    `;

    // Show optimized deductions with animation
    let optimizedAmount = 0;
    Object.entries(deductions).forEach(([key, value]) => {
        if (value > 0) {
            optimizedAmount += value;
            html += `
                <div class="calculation-step deduction optimized">
                    <div>
                        <span class="operator"></span>
                        <span class="step-label">Optimized ${key}</span>
                    </div>
                    <span class="amount-change optimization-highlight">
                        ${formatAmount(value)}
                    </span>
                </div>
            `;
        }
    });

    // Show taxable income after deductions
    const taxableIncome = income - optimizedAmount;
    html += `
        <div class="calculation-step">
            <div>
                <span class="step-label">Taxable Income</span>
            </div>
            <span class="amount-change">${formatAmount(taxableIncome)}</span>
        </div>
    `;

    // Rest of the calculation steps
    // ...existing code for surcharge and cess...

    breakdownDiv.innerHTML = html;
    
    // Animate steps sequentially
    const steps = breakdownDiv.querySelectorAll('.calculation-step');
    steps.forEach((step, index) => {
        setTimeout(() => {
            step.style.opacity = '1';
            if (step.classList.contains('optimized')) {
                step.querySelector('.optimization-highlight').classList.add('flash');
            }
        }, index * 200);
    });
}

// Update autoCalculateDeductions function
function autoCalculateDeductions() {
    if (selectedRegime === 'old') {
        const income = currentSalary;
        const monthlyRent = Number(document.getElementById('rentPaid').value);
        const basicSalary = Number(document.getElementById('basicSalary').value);
        const isMetro = document.getElementById('isMetroCity').checked;

        const deductions = calculateDeductions(income, monthlyRent, basicSalary, isMetro);

        // Show calculation steps instead of updating fields
        const optimizedDeductions = {
            'Standard Deduction': 50000,
            'Section 80C': deductions.section80C,
            'Section 80D': deductions.section80D,
            'HRA': deductions.HRA
        };

        showCalculationSteps(income, optimizedDeductions, 0);
        calculateTax();
    }
}

function calculateTax() {
    const salary = currentSalary;
    const regime = selectedRegime === 'new' ? taxSlabs.newRegime : taxSlabs.oldRegime;
    const { tax, taxableIncome } = calculateTaxForSlabs(salary, regime);

    // Apply surcharge
    let finalTax = tax;
    if (taxableIncome > 5000000 && taxableIncome <= 10000000) {
        finalTax += tax * 0.10;
    } else if (taxableIncome > 10000000 && taxableIncome <= 20000000) {
        finalTax += tax * 0.15;
    } else if (taxableIncome > 20000000 && taxableIncome <= 50000000) {
        finalTax += tax * 0.25;
    } else if (taxableIncome > 50000000) {
        finalTax += tax * 0.37;
    }

    // Add 4% Health and Education Cess
    finalTax += finalTax * 0.04;

    // Update display
    document.getElementById("taxAmount").innerText = formatAmount(finalTax);
    document.getElementById("taxAmountBox").innerText = "Income Tax: " + formatAmount(finalTax);
    document.getElementById("taxableIncome").innerText = "Taxable Income: " + formatAmount(taxableIncome);

    // Show regime comparison
    const otherRegime = selectedRegime === 'new' ? taxSlabs.oldRegime : taxSlabs.newRegime;
    const { tax: otherTax } = calculateTaxForSlabs(salary, otherRegime);
    const savings = Math.abs(finalTax - otherTax);

    document.getElementById("regimeComparison").innerHTML = `
        <div class="regime-comparison">
            <p>Tax in ${selectedRegime.toUpperCase()} regime: ${formatAmount(finalTax)}</p>
            <p>Tax in ${selectedRegime === 'new' ? 'OLD' : 'NEW'} regime: ${formatAmount(otherTax)}</p>
            <p class="savings">You can save ${formatAmount(savings)} by choosing ${finalTax > otherTax ? (selectedRegime === 'new' ? 'OLD' : 'NEW') : selectedRegime.toUpperCase()} regime</p>
        </div>
    `;

    // Show calculation steps
    const deductions = {
        'Standard Deduction': regime === taxSlabs.newRegime ? 75000 : 50000,
        'Section 80C': regime === taxSlabs.oldRegime ? (deductions?.section80C || 0) : 0,
        'Section 80D': regime === taxSlabs.oldRegime ? (deductions?.section80D || 0) : 0,
        'HRA Exemption': regime === taxSlabs.oldRegime ? (deductions?.hra || 0) : 0
    };

    showCalculationSteps(currentSalary, deductions, finalTax);

    // Get AI advice after calculation
    getTaxAdvice();
}

// Add function to auto-calculate deductions
function autoCalculateDeductions() {
    if (selectedRegime === 'old') {
        const income = currentSalary;
        const monthlyRent = Number(document.getElementById('rentPaid').value);
        const basicSalary = Number(document.getElementById('basicSalary').value);
        const isMetro = document.getElementById('isMetroCity').checked;

        const deductions = calculateDeductions(income, monthlyRent, basicSalary, isMetro);

        // Show detailed HRA breakdown
        const hraBreakdown = `
            <div class="hra-breakdown">
                <p>Basic Salary: ₹${formatAmount(basicSalary)}</p>
                <p>Monthly Rent: ₹${formatAmount(monthlyRent)}</p>
                <p>HRA Received: ₹${formatAmount(basicSalary * 0.4)}</p>
                <p>Metro City: ${isMetro ? 'Yes (50%)' : 'No (40%)'}</p>
                <p>Eligible HRA: ₹${formatAmount(deductions.HRA)}</p>
            </div>
        `;
        document.getElementById('hraBreakdown').innerHTML = hraBreakdown;

        // Update deduction fields
        document.getElementById('section80C').value = deductions.section80C;
        document.getElementById('section80D').value = deductions.section80D;
        document.getElementById('hra').value = deductions.HRA;

        calculateTax();
    }
}

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

class TaxInputHandler {
    constructor() {
        this.incomeSources = {
            salary: 0,
            house_property: 0,
            capital_gains: 0,
            business: 0,
            other: 0
        };
        
        // Add property details
        this.propertyDetails = [];
        this.capitalGainsDetails = [];
        
        this.initializeListeners();
    }

    initializeListeners() {
        // Add listeners for income source inputs
        Object.keys(this.incomeSources).forEach(source => {
            const input = document.getElementById(`${source}Income`);
            if (input) {
                input.addEventListener('change', (e) => {
                    this.incomeSources[source] = parseFloat(e.target.value) || 0;
                });
            }
        });

        // Add listeners for deduction inputs
        Object.keys(this.deductions).forEach(deduction => {
            const input = document.getElementById(`section${deduction}`);
            if (input) {
                input.addEventListener('change', (e) => {
                    this.deductions[deduction] = parseFloat(e.target.value) || 0;
                });
            }
        });
    }

    addPropertyDetail() {
        const propertyValue = Number(document.getElementById('propertyValue').value);
        const location = document.getElementById('propertyLocation').value;
        
        this.propertyDetails.push({
            value: propertyValue,
            location: location
        });
        
        this.updatePropertyList();
    }

    addCapitalGain() {
        const detail = {
            type: document.getElementById('assetType').value,
            buy_price: Number(document.getElementById('buyPrice').value),
            sell_price: Number(document.getElementById('sellPrice').value),
            buy_date: new Date(document.getElementById('buyDate').value),
            sell_date: new Date(document.getElementById('sellDate').value)
        };
        
        this.capitalGainsDetails.push(detail);
        this.updateCapitalGainsList();
    }

    async calculate() {
        const payload = {
            income: this.calculateTotalIncome(),
            deductions: this.deductions,
            additional_incomes: this.incomeSources,
            age_category: document.getElementById('ageCategory').value,
            regime: document.querySelector('.regime-option.selected').id === 'newRegimeOption' ? 'new' : 'old',
            property_details: this.propertyDetails,
            capital_gains_details: this.capitalGainsDetails
        };

        try {
            const response = await fetch('/calculate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            new TaxResultPresenter(data).display();
            new AIChatIntegrator().showSuggestions(data);

        } catch (error) {
            console.error('Calculation error:', error);
        }
    }

    updatePropertyList() {
        const container = document.getElementById('propertyList');
        container.innerHTML = this.propertyDetails.map((prop, index) => `
            <div class="property-item">
                <span>Property ${index + 1}: ₹${formatAmount(prop.value)} (${prop.location})</span>
                <button onclick="taxHandler.removeProperty(${index})">Remove</button>
            </div>
        `).join('');
    }

    updateCapitalGainsList() {
        const container = document.getElementById('capitalGainsList');
        container.innerHTML = this.capitalGainsDetails.map((gain, index) => `
            <div class="gain-item">
                <span>${gain.type}: ₹${formatAmount(gain.sell_price - gain.buy_price)}</span>
                <button onclick="taxHandler.removeCapitalGain(${index})">Remove</button>
            </div>
        `).join('');
    }

    calculateTotalIncome() {
        return Object.values(this.incomeSources).reduce((sum, value) => sum + value, 0);
    }
}

class TaxResultPresenter {
    constructor(data) {
        this.data = data;
        this.chartColors = [
            '#4A148C', '#7B1FA2', '#E1BEE7', '#9C27B0',
            '#BA68C8', '#CE93D8', '#F3E5F5'
        ];
    }

    display() {
        this.showTaxBreakdown();
        this.showOptimizations();
        this.showRegimeComparison();
    }

    showTaxBreakdown() {
        const ctx = document.getElementById('taxBreakdownChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(this.data.tax_breakdown),
                datasets: [{
                    data: Object.values(this.data.tax_breakdown),
                    backgroundColor: this.chartColors
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

    showOptimizations() {
        const container = document.getElementById('optimizationContainer');
        container.innerHTML = this.data.optimization_opportunities.map(opt => `
            <div class="optimization-card">
                <h3>${opt.title}</h3>
                <p>${opt.description}</p>
                <div class="savings-amount">Potential Savings: ₹${formatAmount(opt.savings)}</div>
            </div>
        `).join('');
    }

    showRegimeComparison() {
        const container = document.getElementById('regimeComparison');
        const comparison = this.data.regime_comparison;
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
}

class AIChatIntegrator {
    showSuggestions(data) {
        const adviceContainer = document.getElementById('aiAdvice');
        adviceContainer.innerHTML = data.investment_suggestions.map(suggestion => `
            <div class="ai-suggestion">
                <p>${suggestion.text}</p>
                <button onclick="window.open('/chat?q=${encodeURIComponent(suggestion.query)}')">
                    Learn More
                </button>
            </div>
        `).join('');
    }
}

// Initialize the handlers
document.addEventListener('DOMContentLoaded', () => {
    const taxHandler = new TaxInputHandler();
    
    // Override the existing calculate button click handler
    document.querySelector('.calculate-tax-btn').addEventListener('click', () => {
        taxHandler.calculate();
    });
});
