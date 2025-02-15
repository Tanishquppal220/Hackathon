from flask import Flask, render_template, request, jsonify, abort
import plotly
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import json
from tax_utils import TaxPayer
import numpy as np
from flask_cors import CORS
from jinja2.exceptions import TemplateNotFound
import os
from dotenv import load_dotenv
import httpx
import requests

load_dotenv()
app = Flask(__name__)
CORS(app)

# Non-AI related constants
TAX_SLABS = {
    "new_regime": {
        "slabs": [
            {"min": 0, "max": 400000, "rate": 0},
            {"min": 400001, "max": 800000, "rate": 5},
            {"min": 800001, "max": 1200000, "rate": 10},
            {"min": 1200001, "max": 1600000, "rate": 15},
            {"min": 1600001, "max": 2000000, "rate": 20},
            {"min": 2000001, "max": 2400000, "rate": 25},
            {"min": 2400001, "max": float('inf'), "rate": 30}
        ],
        "standard_deduction": 75000,
        "rebate": {
            "max_income": 1200000,
            "amount": 60000
        }
    },
    "old_regime": {
        "slabs": [
            {"min": 0, "max": 250000, "rate": 0},
            {"min": 250001, "max": 500000, "rate": 5},
            {"min": 500001, "max": 1000000, "rate": 20},
            {"min": 1000001, "max": float('inf'), "rate": 30}
        ],
        "standard_deduction": 50000,
        "deductions": {
            "section80C": 150000,
            "section80D": 25000
        }
    }
}

# Core tax calculation functions
def calculate_hra(basic_salary, rent_paid, is_metro, actual_hra):
    if not basic_salary or not rent_paid:
        return 0
    
    metro_percent = 0.5 if is_metro else 0.4
    basic_percent = basic_salary * metro_percent
    rent_minus_basic = rent_paid - (basic_salary * 0.1)
    
    return min(
        actual_hra or (basic_salary * 0.4),
        basic_percent,
        rent_minus_basic
    )

def calculate_tax(income, regime_type, age_category, deductions=None):
    regime = TAX_SLABS[f"{regime_type}_regime"]
    taxable_income = income - regime["standard_deduction"]
    
    if regime_type == "old" and deductions:
        try:
            taxable_income -= (
                min(deductions.get("section80C", 0), regime["deductions"]["section80C"]) +
                min(deductions.get("section80D", 0), regime["deductions"]["section80D"]) +
                deductions.get("hra", 0)
            )
        except Exception as e:
            print(f"Error calculating deductions: {e}")
    
    tax = 0
    for slab in regime["slabs"]:
        if taxable_income > slab["min"]:
            slab_amount = min(taxable_income - slab["min"], slab["max"] - slab["min"])
            tax += (slab_amount * slab["rate"]) / 100
    
    if regime_type == "new" and taxable_income <= regime["rebate"]["max_income"]:
        tax = max(0, tax - regime["rebate"]["amount"])
    
    # Calculate surcharge
    if taxable_income > 50000000:
        tax += tax * 0.37
    elif taxable_income > 20000000:
        tax += tax * 0.25
    elif taxable_income > 10000000:
        tax += tax * 0.15
    elif taxable_income > 5000000:
        tax += tax * 0.10
    
    # Add cess
    tax += tax * 0.04
    
    return {"tax": tax, "taxable_income": taxable_income}

def generate_income_pie_chart():
    # Sample data - replace with actual data from your database
    data = {
        'Slab': ['0-5L', '5L-10L', '10L-15L', '15L+'],
        'Amount': [250000, 300000, 400000, 550000]
    }
    df = pd.DataFrame(data)
    
    fig = px.pie(df, values='Amount', names='Slab', title='Income Distribution by Slabs')
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font={'color': '#333'}
    )
    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

def generate_liability_trend():
    # Sample data - replace with actual data
    months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
    values = [45000, 48000, 52000, 49000, 53000, 55000]
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=months, y=values, mode='lines+markers'))
    fig.update_layout(
        title='Monthly Tax Liability Trend',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font={'color': '#333'},
        xaxis_title="Month",
        yaxis_title="Tax Liability (₹)"
    )
    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

# Basic routes
@app.route('/')
def dash():
    pie_chart = generate_income_pie_chart()
    line_chart = generate_liability_trend()
    return render_template('Dashboard.html', 
                         pie_chart=pie_chart,
                         line_chart=line_chart)

@app.route('/calc')
def calc():
    return render_template('calc.html')

@app.route('/learn')
def learn():
    return render_template('learn.html')

@app.route('/learn/<page>')
def learning_content(page):
    try:
        if not page.endswith('.html'):
            page = f"{page}.html"
        return render_template(f'learning/{page}')
    except TemplateNotFound:
        abort(404)

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    try:
        result = calculate_tax(
            income=data['income'],
            regime_type=data['regime'],
            age_category=data['age_category'],
            deductions=data.get('deductions')
        )
        
        # Calculate comparison with other regime
        other_regime = "old" if data['regime'] == "new" else "new"
        comparison = calculate_tax(
            income=data['income'],
            regime_type=other_regime,
            age_category=data['age_category']
        )
        
        return jsonify({
            "tax_breakdown": result,
            "regime_comparison": {
                "current_regime": result["tax"],
                "other_regime": comparison["tax"]
            },
            "optimization_opportunities": generate_optimization_suggestions(data, result)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

def generate_optimization_suggestions(data, result):
    suggestions = []
    if data['regime'] == "old":
        if data['income'] > 150000 and not data.get('deductions', {}).get('section80C'):
            suggestions.append({
                "type": "80C",
                "message": "Consider investing in 80C options to save up to ₹46,800 in tax"
            })
    return suggestions

# AI-related functions
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

@app.route('/chat', methods=['POST','GET'])
def chat():
    if request.method == 'GET':
        return render_template('chat.html')
    
    try:
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return jsonify({
                "status": "error",
                "response": "AI service is not configured properly."
            }), 500

        data = request.json
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({
                "status": "error",
                "response": "Message cannot be empty"
            }), 400

        print(f"Sending message to Gemini: {user_message[:50]}...")

        payload = {
            "contents": [{
                "parts": [{
                    "text": f"As an Indian tax expert, answer this question: {user_message}"
                }]
            }]
        }
        
        response = requests.post(
            f"{GEMINI_BASE_URL}?key={api_key}",
            headers={'Content-Type': 'application/json'},
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"Error response: {response.text}")
            raise Exception(f"API error: {response.status_code}")

        response_data = response.json()
        
        # Extract the response text and format it
        if 'candidates' in response_data and response_data['candidates']:
            ai_response = response_data['candidates'][0]['content']['parts'][0]['text']
            # Format response: replace newlines with <br>, etc.
            ai_response = ai_response.replace('\n', '<br>')
            return jsonify({
                "status": "success",
                "response": ai_response
            })
        else:
            return jsonify({
                "status": "error",
                "response": "No valid response generated"
            }), 500

    except Exception as e:
        print(f"Chat Error: {str(e)}")
        return jsonify({
            "status": "error",
            "response": "I apologize, but I'm having trouble connecting to the AI service.",
            "error": str(e)
        }), 500

# Update the tax-advice route similarly
@app.route('/tax-advice', methods=['POST'])
def tax_advice():
    try:
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return jsonify({"advice": "AI service is not configured properly."}), 500

        data = request.json
        prompt = f"""As an Indian tax advisor, provide optimization advice for:
        - Annual Income: ₹{data.get('income', 0)}
        - Current Tax Regime: {data.get('regime', 'new')}
        - Current Tax Amount: ₹{data.get('currentTax', 0)}
        Suggest ways to optimize tax savings within legal limits."""

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ]
        }
        
        response = requests.post(
            f"{GEMINI_BASE_URL}?key={api_key}",
            headers={'Content-Type': 'application/json'},
            json=payload
        )
        
        if response.status_code != 200:
            print(f"Error response: {response.text}")
            raise Exception(f"Gemini API returned status code {response.status_code}")

        response_data = response.json()
        advice = response_data['candidates'][0]['content']['parts'][0]['text']
        return jsonify({"advice": advice})

    except Exception as e:
        print(f"Tax Advice Error: {str(e)}")
        return jsonify({"advice": "Unable to generate tax advice at the moment."}), 500

def generate_tax_advice(income, regime, current_tax):
    advice = []
    if regime == "old" and income < 1500000:
        advice.append("Consider NPS investment for additional tax benefits under 80CCD(1B)")
    return "\n".join(advice) or "No specific tax saving opportunities identified at this time."

if __name__ == '__main__':
    app.run(debug=True)
