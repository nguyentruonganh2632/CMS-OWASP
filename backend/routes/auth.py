"""
Auth routes - CatFood Shop CMS
"""

from flask import Blueprint, request, jsonify
import jwt
import datetime
from models.db import get_db_connection
from config import Config

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '')
    password = data.get('password', '')

    db = get_db_connection()
    if not db:
        return jsonify({'error': 'Lỗi hệ thống, vui lòng thử lại sau'}), 500

    cursor = db.cursor()

    # Ngăn chặn các kiểu comment đơn giản để làm khó thêm 1 chút
    if '--' in email or '#' in email or '/*' in email:
        return jsonify({'error': 'Phát hiện ký tự nghi vấn!'}), 400

    # Lỗ hổng SQL Injection (Mật khẩu được check thẳng trong DB, hỗ trợ cả tiền tố plain: hoặc scrypt:)
    query = f"SELECT * FROM users WHERE email='{email}' AND (password_hash='{password}' OR password_hash='plain:{password}' OR password_hash='scrypt:{password}')"
    try:
        cursor.execute(query)
    except Exception as e:
        db.close()
        return jsonify({'error': 'Email hoặc mật khẩu không chính xác'}), 401

    user = cursor.fetchone()
    db.close()

    if not user:
        return jsonify({'error': 'Email hoặc mật khẩu không chính xác'}), 401

    token = jwt.encode({
        'user_id': user['id'],
        'email': user['email'],
        'role_id': user['role_id'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24),
    }, Config.SECRET_KEY, algorithm='HS256')

    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'uuid': user.get('uuid'),
            'email': user['email'],
            'full_name': user['full_name'],
            'phone': user.get('phone'),
            'role_id': user['role_id'],
            'balance': float(user.get('balance', 100000)),
            'password_hash': user.get('password_hash'),
        }
    }), 200


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    full_name = data.get('full_name', '')
    email = data.get('email', '')
    password = data.get('password', '')
    phone = data.get('phone', '')

    # Vulnerable: plain text password storage
    plain_password_stored = f"plain:{password}"

    db = get_db_connection()
    if not db:
        return jsonify({'error': 'Lỗi hệ thống'}), 500

    cursor = db.cursor()

    import uuid
    new_uuid = str(uuid.uuid4())
    # Vulnerable: SQL injection in INSERT
    query = f"""
        INSERT INTO users (full_name, email, phone, password_hash, role_id, balance, status, uuid, created_at)
        VALUES ('{full_name}', '{email}', '{phone}', '{plain_password_stored}', 2, 100000.00, 1, '{new_uuid}', NOW())
    """
    try:
        cursor.execute(query)
        db.close()
        return jsonify({'message': 'Đăng ký thành công! Bạn nhận được 100,000 VNĐ vào ví.'}), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400


@auth_bp.route('/me', methods=['GET'])
def get_me():
    """Get current user info including balance"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        # Lỗ hổng JWT: Cho phép thuật toán "none" (Algorithm Confusion)
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256', 'none'], options={"verify_signature": False} if jwt.get_unverified_header(token).get('alg') == 'none' else {})
    except:
        return jsonify({'error': 'Token không hợp lệ'}), 401

    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT id, full_name, email, phone, role_id, balance FROM users WHERE id=%s", (payload['user_id'],))
    user = cursor.fetchone()
    db.close()

    if not user:
        return jsonify({'error': 'Người dùng không tồn tại'}), 404

    return jsonify({'user': {**user, 'balance': float(user['balance'])}}), 200
