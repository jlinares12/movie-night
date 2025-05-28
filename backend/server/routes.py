from server import app, db
from server.models import User
from flask import request, jsonify, make_response

# create test route
@app.route('/test', methods=['GET'])
def test():
    return jsonify({'message' : 'The server is running!'})

# create a user
@app.route('/api/flask/users', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        new_user = User(name=data['name'], email=data['email'])
        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'id': new_user.id,
            'name': new_user.name,
            'email': new_user.email
        }), 201
    except Exception as e:
        return make_response(jsonify({
            'message': 'error creating user', 'error' : str(e)
        }), 500)

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
