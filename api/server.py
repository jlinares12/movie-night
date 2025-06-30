from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app)

@app.route('/api/data')
def data():
    return {"tech" : ["Flask", "React", "Python", "Typescript"]}

if __name__ == '__main__':
    app.run(debug=True)