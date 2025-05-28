from server import app, db
from server.models import User
from flask import request, jsonify, make_response

# create test route
@app.route("/api/healthchecker", methods=["GET"])
def healthChecker():
    return {"status": "success", "message": "Integrate Flask Framework with Next.js"}

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

@app.route('/register', methods=['GET','POST'])
def register_page():
    form = RegisterUserForm()
    if form.validate_on_submit():
        user_to_create = User(name=form.name.data,
                              username=form.username.data,
                              email=form.email.data,
                              password=form.password1.data)
        db.session.add(user_to_create)
        db.session.commit()
        login_user(user_to_create)
        flash(f'You created your account successfully! Welcome to the site {user_to_create.username}', category='success')
        return redirect(url_for('profile_page', username=current_user.username))
    if form.errors != {}:                                           # If there are errors from the validations
        for err_msg in form.errors.values():
            flash(f'There was an error with creating a user: {err_msg[0]}', category='danger')
    return render_template('register_page.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login_page():
    if current_user.is_authenticated:
        return redirect(url_for('home_page'))
    form = LoginForm()
    if form.validate_on_submit():
        attempted_user = User.query.filter_by(username=form.username.data).first()
        if not attempted_user or not attempted_user.check_password_correction(form.password.data):
            flash(f'Invalid username or password', category='danger')
            return redirect(url_for('login_page'))
        login_user(attempted_user)
        next = request.args.get('next')
        flash(f'Login was successful! You are logged in as: {attempted_user.username}', category='success')
        if not url_has_allowed_host_and_scheme(next, request.host):
            return redirect(url_for('home_page'))
        return redirect(next)
    return render_template('login_page.html', form=form)
