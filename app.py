from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('layout.html')
@app.route('/dashboard')
def dash():
    return render_template('Dashboard.html')


if __name__ == '__main__':
    app.run(debug=True)
