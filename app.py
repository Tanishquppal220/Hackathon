from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html',x='Dashboard')
@app.route('/calc')
def calc():
    return render_template('calc.html',x='calc')

if __name__ == '__main__':
    app.run(debug=True)
