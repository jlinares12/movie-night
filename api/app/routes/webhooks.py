from flask import Blueprint, request, jsonify
from app.models.user import User
from app.extensions import db
import os

from svix.webhooks import Webhook, WebhookVerificationError

CLERK_WEBHOOK_SECRET = os.getenv('CLERK_WEBHOOK_SECRET')

bp = Blueprint('webhooks', __name__)

@bp.route('/api/webhook/clerk', methods=["POST"])
def handle_clerk_webhook():
    headers = request.headers
    payload = request.get_data()

    if not headers:
        return jsonify({'error': 'Missing headers'}), 400

    try:
        wh = Webhook(CLERK_WEBHOOK_SECRET)
        msg = wh.verify(payload, headers)
    except WebhookVerificationError as e:
        return jsonify({'error': 'Invalid signature'}), 401

    event_type = msg['type']
    data = msg['data']

    try:
        if event_type == "user.created":
            user_id = data['id']
            username = data.get('username', '')
            response, status_code = create_user(user_id, username)
        elif event_type == "user.updated":
            user_id = data['id']
            username = data.get('username', '')
            response, status_code = update_user(user_id, username)
        elif event_type == "user.deleted":
            user_id = data['id']
            response, status_code = delete_user(user_id)
        else:
            return jsonify({'message': 'Event type not handled'}), 200

        return jsonify(response), status_code
    except KeyError as e:
        return jsonify({'error': f'Missing expected data: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

def create_user(user_id, username):
    try:
        if User.query.filter_by(user_id=user_id).first():
            return {'message': 'User already exists'}, 200

        user = User(user_id=user_id, username=username)
        db.session.add(user)
        db.session.commit()
        return {'message': 'User created successfully'}, 201
    except Exception as e:
        db.session.rollback()
        return {'message': 'Error creating user', 'error': str(e)}, 500

def update_user(user_id, username):
    try:
        user = User.query.filter_by(user_id=user_id).first()
        if not user:
            return {'message': 'User not found'}, 404

        user.username = username
        db.session.commit()
        return {'message': 'User updated successfully'}, 200
    except Exception as e:
        db.session.rollback()
        return {'message': 'Error updating user', 'error': str(e)}, 500

def delete_user(user_id):
    try:
        user = User.query.filter_by(user_id=user_id).first()
        if not user:
            return {'message': 'User not found'}, 404

        db.session.delete(user)
        db.session.commit()
        return {'message': 'User deleted successfully'}, 200
    except Exception as e:
        db.session.rollback()
        return {'message': 'Error deleting user', 'error': str(e)}, 500