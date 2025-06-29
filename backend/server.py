from flask import Flask, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
cors = CORS(app)

@app.route('/')
def home():
    return send_from_directory(app.static_folder, "index.html")

@app.route('/data')
def data():
    return {"tech" : ["Flask", "React", "Python", "Typescript"]}

if __name__ == '__main__':
    app.run(debug=True)