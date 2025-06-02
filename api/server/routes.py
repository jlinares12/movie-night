from api.server import app, db
from api.server.models import User
from flask import request, jsonify, make_response
from flask_login import login_user, logout_user, login_required, current_user

# create test route
@app.route("/api/healthchecker", methods=["GET"])
def healthChecker():
    return {"status": "success", "message": "Integrate Flask Framework with Next.js"}

# create a user
@app.route('/api/register', methods=["GET", "POST"])
def register():
    data = request.get_json()
    new_username=data['username'],
    new_email=data['email'],
    new_password=data['password']

    user = User.query.filter_by(username = new_username ).first()
    email = User.query.filter_by(email = new_email ).first()
    if user:
        print("user test")
        return make_response( jsonify({
            'error' : "Username is already in use"
        }), 500)
    if email:
        return make_response( jsonify({
            'error' : "Email is already in use"
        }), 500)
    try:
        new_user = User( username=new_username, email=new_email, password=new_password)
        db.session.add( new_user )
        db.session.commit()

        return make_response(jsonify({
            "message" : "User created successfully"
        }), 201)
    except Exception as e:
        return make_response(jsonify({
            "message" : "error creating user", 'error' : str(e)
        }), 500)

@app.route('/api/login', methods=['GET', 'POST'])
def login():
    data = request.get_json()
    attempted_user = User.query.filter_by(username=data['username']).first()
    if not attempted_user or not attempted_user.check_password_correction(data['password']):
        return make_response(jsonify({
            "error" : "Username or password is incorrect"
        }), 500)
    login_user(attempted_user)
    return make_response(jsonify({
        'message' : 'user logged in successfully!'
    }), 201)

# get users
@app.route('/api/flask/users', methods=['GET'])
def get_users():
    try:
        users = User.query.all()
        users_data = [{
            'id': user.id,
            'name': user.name,
            'email': user.email
        } for user in users]
        return jsonify(users_data),200
    except Exception as e:
        return make_response(jsonify({
            'message': 'error getting user', 'error' : str(e)
        }), 500)

# get user by id
@app.route('/api/flask/users/<id>', methods=['GET'])
def get_user(id):
    try:
        user = User.query.filter_by(id = id).first()
        if user:
            return make_response(jsonify({'user': user.json()}), 200)
        return make_response(jsonify({'message': 'user not found'}), 404)
    except Exception as e:
        return make_response(jsonify({
            'message': 'error getting user', 'error' : str(e)
        }), 500)

# update a user by id
@app.route('/api/flask/users/<id>', methods=['PUT'])
def update_user(id):
    try:
        user = User.query.filter_by(id = id).first()
        if user:
            data = request.get_json()
            user.name = data['name']
            user.email = data['email']
            db.session.commit()
            return make_response(jsonify({'message': 'user updated'}), 200)
        return make_response(jsonify({'message': 'user not found'}), 404)
    except Exception as e:
        return make_response(jsonify({
            'message': 'error updating user', 'error' : str(e)
        }), 500)

# delete a user by id
@app.route('/api/flask/users/<id>', methods=['DELETE'])
def delete_user(id):
    try:
        user = User.query.filter_by(id = id).first()
        if user:
            db.session.delete(user)
            db.session.commit()
            return make_response(jsonify({'message': 'user deleted'}), 200)
        return make_response(jsonify({'message' : 'user not found'}), 404)
    except Exception as e:
        return make_response(jsonify({
            'message': 'error deleting user', 'error' : str(e)
        }), 500)
