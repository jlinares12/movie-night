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
    "id": "1",
    "name": "PipiPoopoo",
    "user_count": "12",
    "date": "August 12, 2025"
  },
  {
    "id": "2",
    "name": "Carmenita Boys",
    "user_count": "3",
    "date": "July 23, 2025"
  },
  {
    "id": "3",
    "name": "Rialto House",
    "user_count": "7",
    "date": "August 23, 2025"
  }
]


if __name__ == '__main__':
    app.run()