from flask import Flask, render_template, request, jsonify
from openai import OpenAI
import os
from dotenv import load_dotenv
import httpx
import plotly
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import json
from tax_utils import TaxPayer  # Replace taxcalc_india import
import numpy as np

load_dotenv()

app = Flask(__name__)

try:
    # Create custom HTTP client for OpenRouter
    http_client = httpx.Client(
        base_url="https://api.openrouter.ai/api/v1",  # Updated URL
        timeout=60.0,
        headers={
            "HTTP-Referer": "https://taxguru.com",  # Your site URL
            "X-Title": "TaxGuru AI",  # Your app name
        }
    )
    
    client = OpenAI(
        base_url="https://api.openrouter.ai/api/v1/chat/completions",  # Specific endpoint
        api_key=os.getenv('OPENROUTER_API_KEY'),
        http_client=http_client
    )
except Exception as e:
    print(f"Error initializing OpenAI client: {str(e)}")
    client = None

@app.route('/')
def home():
    return render_template('layout.html')

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

@app.route('/dashboard')
def dash():
    pie_chart = generate_income_pie_chart()
    line_chart = generate_liability_trend()
    return render_template('Dashboard.html', 
                         pie_chart=pie_chart,
                         line_chart=line_chart)

@app.route('/calc')
def calc():
    return render_template('calc.html')

@app.route('/chat', methods=['POST','GET'])
def chat():
    try:
        if not client:
            return jsonify({"response": "AI service is not configured properly."}), 500

        data = request.json
        user_message = data['message']

        completion = client.chat.completions.create(
            model="meta-llama/llama-2-70b-chat",  # Updated model
            messages=[
                {
                    "role": "system",
                    "content": "You are TaxGuru AI, an expert Indian tax advisor. Provide clear, concise answers about Indian tax laws and regulations."
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ]
        )

        ai_response = completion.choices[0].message.content.strip()
        return jsonify({"response": ai_response})

    except Exception as e:
        print(f"Chat Error: {str(e)}")
        return jsonify({
            "response": "I apologize, but I'm having trouble connecting to the AI service. Please try again in a moment."
        }), 500

@app.route('/tax-advice', methods=['POST'])
def tax_advice():
    try:
        data = request.json
        income = data.get('income', 0)
        regime = data.get('regime', 'new')
        current_tax = data.get('currentTax', 0)

        prompt = f"""
        As a tax advisor, provide optimization advice for:
        - Annual Income: ₹{income}
        - Current Tax Regime: {regime}
        - Current Tax Amount: ₹{current_tax}

        Suggest ways to optimize tax savings within legal limits.
        """

        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "https://taxguru.com",
                "X-Title": "TaxGuru AI",
            },
            model="meta-llama/llama-guard-3-8b",
            messages=[
                {
                    "role": "system",
                    "content": "You are an Indian tax optimization expert. Provide specific, actionable advice."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        advice = completion.choices[0].message.content.strip()
        return jsonify({"advice": advice})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"advice": "Unable to generate tax advice at the moment."}), 500

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.json
        
        # Create taxpayer object using our custom class
        taxpayer = TaxPayer(
            income=float(data['income']),
            age_category=data['age_category'],
            regime=data['regime'],
            deductions=data.get('deductions', {}),
            additional_incomes=data.get('additional_incomes', {})
        )

        # Get analysis using our custom methods
        analysis = {
            'tax_breakdown': taxpayer.get_tax_breakdown(),
            'optimization_opportunities': taxpayer.find_optimizations(),
            'regime_comparison': taxpayer.compare_regimes(),
            'investment_suggestions': taxpayer.generate_suggestions()
        }

        return jsonify(analysis)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
