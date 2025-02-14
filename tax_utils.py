class PropertyTax:
    def calculate_property_tax(self, property_value, location_type):
        # Basic property tax rates (can be customized based on location)
        rates = {
            'metro': 0.02,  # 2% for metro cities
            'urban': 0.015, # 1.5% for urban areas
            'rural': 0.01   # 1% for rural areas
        }
        return property_value * rates.get(location_type, 0.015)

class CapitalGains:
    def calculate_capital_gains(self, acquisition_price, selling_price, acquisition_date, selling_date, asset_type):
        holding_period = (selling_date - acquisition_date).days / 365
        gain = selling_price - acquisition_price
        
        if asset_type == 'equity':
            if holding_period > 1:
                # Long term capital gains on equity (>1 year)
                return max(0, gain - 100000) * 0.10 if gain > 100000 else 0
            else:
                # Short term capital gains on equity
                return gain * 0.15
        
        elif asset_type == 'property':
            if holding_period > 2:
                # Long term capital gains on property (>2 years)
                indexed_cost = acquisition_price * (1 + (holding_period * 0.10))  # Simple inflation adjustment
                return max(0, selling_price - indexed_cost) * 0.20
            else:
                # Short term capital gains on property
                return gain * 0.30
        
        return gain * 0.30  # Default rate for other assets

class TaxPayer:
    def __init__(self, income, age_category, regime, deductions=None, additional_incomes=None):
        self.income = income
        self.age_category = age_category
        self.regime = regime
        self.deductions = deductions or {}
        self.additional_incomes = additional_incomes or {}
        self.property_tax = PropertyTax()
        self.capital_gains = CapitalGains()

    def get_tax_breakdown(self):
        # Enhanced tax breakdown calculation
        gross_tax = self._calculate_gross_tax()
        property_tax = 0
        capital_gains_tax = 0
        
        if self.additional_incomes.get('property'):
            property_tax = self.property_tax.calculate_property_tax(
                self.additional_incomes['property']['value'],
                self.additional_incomes['property']['location']
            )
        
        if self.additional_incomes.get('capital_gains'):
            capital_gains_tax = self.capital_gains.calculate_capital_gains(
                self.additional_incomes['capital_gains']['buy_price'],
                self.additional_incomes['capital_gains']['sell_price'],
                self.additional_incomes['capital_gains']['buy_date'],
                self.additional_incomes['capital_gains']['sell_date'],
                self.additional_incomes['capital_gains']['type']
            )
        
        return {
            'Basic Tax': round(gross_tax * 0.8, 2),
            'Surcharge': round(gross_tax * 0.1, 2),
            'Cess': round(gross_tax * 0.04, 2),
            'Property Tax': round(property_tax, 2),
            'Capital Gains Tax': round(capital_gains_tax, 2),
            'Total': round(gross_tax + property_tax + capital_gains_tax, 2)
        }

    def find_optimizations(self):
        # Simple optimization suggestions
        suggestions = []
        
        if self.regime == 'old':
            unused_80c = 150000 - self.deductions.get('80C', 0)
            if unused_80c > 0:
                suggestions.append({
                    'title': 'Section 80C Investment',
                    'description': f'Invest ₹{unused_80c:,.2f} more in 80C to maximize tax benefits',
                    'savings': round(unused_80c * 0.3, 2)
                })

        if self.income > 500000:
            suggestions.append({
                'title': 'HRA Benefits',
                'description': 'Consider claiming HRA benefits if paying rent',
                'savings': round(self.income * 0.1, 2)
            })

        return suggestions

    def compare_regimes(self):
        old_tax = self._calculate_tax('old')
        new_tax = self._calculate_tax('new')
        
        return {
            'old_regime': old_tax,
            'new_regime': new_tax,
            'suggestion': 'New Regime' if new_tax < old_tax else 'Old Regime'
        }

    def generate_suggestions(self):
        return [
            {
                'text': 'Consider tax-saving investments under Section 80C',
                'query': 'What are the best 80C investment options?'
            },
            {
                'text': 'Review your HRA claims and rental agreements',
                'query': 'How to optimize HRA tax benefits?'
            }
        ]

    def _calculate_gross_tax(self):
        # Simplified tax calculation
        taxable_income = self.income
        
        if self.regime == 'old':
            for deduction in self.deductions.values():
                taxable_income -= deduction

        if taxable_income <= 500000:
            return 0
        elif taxable_income <= 1000000:
            return (taxable_income - 500000) * 0.2
        else:
            return 100000 + (taxable_income - 1000000) * 0.3

    def _calculate_tax(self, regime):
        # Basic tax calculation for regime comparison
        if regime == 'old':
            return self._calculate_gross_tax() * 1.04  # Including 4% cess
        else:
            return self._calculate_gross_tax() * 0.9  # Simplified new regime calculation

    def calculate_other_taxes(self, property_details=None, capital_gains_details=None):
        other_taxes = {
            'property_tax': 0,
            'capital_gains_tax': 0,
            'total_tax_liability': 0
        }
        
        # Calculate property tax if details provided
        if property_details:
            other_taxes['property_tax'] = sum(
                self.property_tax.calculate_property_tax(prop['value'], prop['location'])
                for prop in property_details
            )
        
        # Calculate capital gains tax if details provided
        if capital_gains_details:
            other_taxes['capital_gains_tax'] = sum(
                self.capital_gains.calculate_capital_gains(
                    asset['buy_price'],
                    asset['sell_price'],
                    asset['buy_date'],
                    asset['sell_date'],
                    asset['type']
                ) for asset in capital_gains_details
            )
        
        # Calculate total tax liability
        other_taxes['total_tax_liability'] = (
            self._calculate_gross_tax() +
            other_taxes['property_tax'] +
            other_taxes['capital_gains_tax']
        )
        
        return other_taxes
