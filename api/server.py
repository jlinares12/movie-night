from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app)

@app.route('/api/data')
def data():
    return {"tech" : ["Flask", "React", "Python", "Typescript"]}

@app.route('/api/groups')
def groups():
    return [
  {
    "name": "PipiPoopoo",
    "id": "1234124124"
  },
  {
    "name": "Carmenita Boys",
    "id": "5345132425"
  }
]


if __name__ == '__main__':
    app.run()