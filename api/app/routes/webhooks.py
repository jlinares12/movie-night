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
    if event_type == "user.created":
        user_id = msg['data']['id']
        username = msg['data']['username']
        create_user(user_id, username)


    return ("", 204)

def create_user(user_id, username):
    user = User(user_id = user_id, username = username)
    db.session.add(user)
    db.session.commit()