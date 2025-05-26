from backend import app
from flask import jsonify

@app.route('/api/server')
def server():
    return jsonify({ 'message' : "Hello" })