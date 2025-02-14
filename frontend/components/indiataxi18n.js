const messages = {
    "en": {
        "intro": {
            "content": "Welcome to the India Tax Calculator. This website has been made for you to quickly get an idea of the amount of taxes you might have to pay especially for the work visa holders. Refer to India Income Tax Department to know exactly how taxation works for you. Please feel free to leave the comments below at the bottom of this page. As of {average_year}, the average salary a year in India is {average_salary}.",
            "average_year": "2022",
            "average_salary": "₹7,50,000"
        },
        "salary": {
            "title": "How much do you make {ayear}? {expenses}",
            "ayear": "a year",
            "expenses": "(after expenses, if any)",
            "net_income": "Your net income is:"
        },
        "about": {
            "title": "About the {website}",
            "content": "The India Tax Calculator is maintained by {author}. It was refer the {thanks_website} UI design and code base (that was maintained by {thanks_author} and Emi). If you find errors in those calculations, feel free to look into the code. It is being kept as simple as possible. If more changes need to be made, please feel free to create issue or pull request via {github}."
        },
        "disclaimer": {
            "title": "Disclaimer",
            "content": "All the information on the India Tax Calculator (website) is published for general information purpose only. The website does not make any warranties about the completeness, reliability, and accuracy of this information. Any action you take upon the information you find on this website is strictly at your own risk. We will not be liable for any losses and/or damages in connection with the use of our website."
        }
    },
    // ...existing code for other languages...
}

const locale = (navigator.language || navigator.browserLanguage).toLowerCase();

const i18n = new VueI18n({
    locale: (locale == 'zh-tw' || locale == 'zh-cn') ? locale : 'en',
    messages: messages,
})

var app = new Vue({
    el: '#wrapper',

    i18n: i18n,

    data: {

        // USER ENTRIES
        uiSalary: 750000,
        salary: 0,
        isPermanentResident: false,
        isNonResident: false,

        // CALCULATIONS
        pfWithholdAmount: 0,
        incomeTaxAmount: 0,
        incomeNet: 0,

        // PERCENT OF SALARY
        pfWithholdPercent: 0,
        incomeTaxPercent: 0,
        incomeNetPercent: 0

    },

    mounted: function() {
        this.calculateAll();
    },

    watch: {

        isPermanentResident: function() {
            this.calculateAll();
        },
        isNonResident: function() {
            this.calculateAll();
        },
        uiSalary: function(newSalary) {
            this.calculateAll();
        }

    },

    methods: {

        calculateAll: function() {
            this.salary = parseInt(this.uiSalary);
            this.taxableIncome = this.salary;
            this.calculatePfWithholdAmount();
            this.calculateIncomeTaxAmount();
            this.calculateIncomeNet();
        },

        calculatePfWithholdAmount: function() {
            var taxableIncome = this.taxableIncome;
            this.pfWithholdAmount = 0;

            if (this.isPermanentResident) {
                var pfCeiling = 15000 * 12;
                if (taxableIncome > pfCeiling) {
                    this.pfWithholdAmount = pfCeiling * 0.12;
                }
                else {
                    this.pfWithholdAmount = taxableIncome * 0.12;
                }
            }

            this.pfWithholdPercent = Math.round(
                this.pfWithholdAmount / this.salary * 100);
        },

        calculateIncomeTaxAmount: function() {
            var taxableIncome = this.taxableIncome - this.pfWithholdAmount;
            this.incomeTaxAmount = 0;

            if (taxableIncome > 1500000) {
                this.incomeTaxAmount = (taxableIncome - 1500000) * 0.30 + 187500;
            }
            else if (taxableIncome > 1250000) {
                this.incomeTaxAmount = (taxableIncome - 1250000) * 0.25 + 125000;
            }
            else if (taxableIncome > 1000000) {
                this.incomeTaxAmount = (taxableIncome - 1000000) * 0.20 + 75000;
            }
            else if (taxableIncome > 500000) {
                this.incomeTaxAmount = (taxableIncome - 500000) * 0.10 + 12500;
            }
            else if (taxableIncome > 250000) {
                this.incomeTaxAmount = (taxableIncome - 250000) * 0.05;
            }

            // 15% of gross income or 22% of net income
            if (this.isNonResident) {
                if (taxableIncome * 0.15 > this.incomeTaxAmount) {
                    this.incomeTaxAmount = taxableIncome * 0.15
                }
            }

            this.incomeTaxPercent = Math.round(this.incomeTaxAmount / this.salary * 100);
        },

        calculateIncomeNet: function() {
            this.incomeNet = this.salary - this.pfWithholdAmount - this.incomeTaxAmount;
            this.incomeNetPercent = Math.round(this.incomeNet / this.salary * 100);
            //console.debug("Income Net: ", this.incomeNet);
        },

    },

    filters: {

        toINR: function(value) {
            if (!value)
                return '₹0';
            var val = Math.round(value);
            return "₹" + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

    }
})
