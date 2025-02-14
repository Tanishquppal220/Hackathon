from flask import Flask, render_template, request, jsonify
import openai
import os

 # Load environment variables

app = Flask(__name__)

# Configure OpenAI API key

openai.api_key = os.getenv('OPENAI_API_KEY')

@app.route('/')
def home():
    return render_template('layout.html')

@app.route('/dashboard')
def dash():
    return render_template('Dashboard.html')

@app.route('/calc')
def calc():
    return render_template('calc.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data['message']

        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful tax advisor assistant. Provide clear, concise answers about Indian tax laws and regulations."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=150,
            temperature=0.7
        )

        # Extract the AI response
        ai_response = response.choices[0].message['content'].strip()
        
        return jsonify({"response": ai_response})
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"response": "I apologize, but I'm having trouble processing your request right now."}), 500

if __name__ == '__main__':
    app.run(debug=True)
