"""
Posts and Reviews routes - CatFood Shop CMS
"""

from flask import Blueprint, request, jsonify, make_response
import jwt
from models.db import get_db_connection
from config import Config

posts_bp = Blueprint('posts', __name__)


def get_current_user(req):
    token = req.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return None
    try:
        # Lỗ hổng JWT: Cho phép thuật toán "none" (Algorithm Confusion)
        return jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256', 'none'], options={"verify_signature": False} if jwt.get_unverified_header(token).get('alg') == 'none' else {})
    except:
        return None


@posts_bp.route('/reviews', methods=['POST'])
def add_review():
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Vui lòng đăng nhập để đánh giá'}), 401

    data = request.get_json()
    product_id = data.get('product_id')
    rating = data.get('rating', 5)
    comment = data.get('comment', '')  
    
    # Nâng cấp XSS: Bộ lọc nửa mùa chặn chữ "script", "onerror", "img"
    if 'script' in comment.lower() or 'onerror' in comment.lower() or '<img' in comment.lower():
        return jsonify({'error': 'Nội dung có chứa từ khóa bị cấm!'}), 400
        
    # Stored XSS: raw HTML stored to DB after passing the naive filter

    db = get_db_connection()
    cursor = db.cursor()
    query = f"""
        INSERT INTO reviews (user_id, product_id, rating, comment)
        VALUES ({current['user_id']}, {product_id}, {rating}, '{comment}')
    """
    try:
        cursor.execute(query)
        db.close()
        return jsonify({'message': 'Cảm ơn bạn đã đánh giá!'}), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400


@posts_bp.route('/reviews', methods=['GET'])
def get_reviews():
    product_id = request.args.get('product_id')
    db = get_db_connection()
    cursor = db.cursor()
    if product_id:
        cursor.execute(
            "SELECT r.*, u.full_name FROM reviews r LEFT JOIN users u ON r.user_id=u.id WHERE r.product_id=%s AND r.status=1 ORDER BY r.created_at DESC",
            (product_id,)
        )
    else:
        cursor.execute("SELECT r.*, u.full_name FROM reviews r LEFT JOIN users u ON r.user_id=u.id WHERE r.status=1 ORDER BY r.created_at DESC")
    reviews = cursor.fetchall()
    db.close()
    return jsonify({'reviews': reviews}), 200


@posts_bp.route('/posts/search', methods=['GET'])
def search_posts():
    q = request.args.get('q', '')
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute(
        "SELECT * FROM posts WHERE title LIKE %s OR content LIKE %s",
        (f'%{q}%', f'%{q}%')
    )
    posts = cursor.fetchall()
    db.close()
    # Reflected XSS: q embedded in HTML response
    html = f"<html><body><h1>Kết quả cho: {q}</h1><p>{len(posts)} bài viết</p></body></html>"
    resp = make_response(html)
    resp.content_type = 'text/html'
    return resp


@posts_bp.route('/posts', methods=['GET'])
def get_posts():
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT p.*, u.full_name as author_name FROM posts p LEFT JOIN users u ON p.author_id=u.id WHERE p.status=1 ORDER BY p.created_at DESC")
    posts = cursor.fetchall()
    db.close()
    return jsonify({'posts': posts}), 200


@posts_bp.route('/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM posts WHERE id=%s", (post_id,))
    post = cursor.fetchone()
    db.close()
    if not post:
        return jsonify({'error': 'Bài viết không tồn tại'}), 404
    return jsonify({'post': post}), 200


@posts_bp.route('/posts', methods=['POST'])
def create_post():
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    title = data.get('title', '')
    content = data.get('content', '')

    import re
    import time
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()) + f'-{int(time.time())}'

    db = get_db_connection()
    cursor = db.cursor()
    query = f"""
        INSERT INTO posts (title, slug, content, author_id)
        VALUES ('{title}', '{slug}', '{content}', {current['user_id']})
    """
    try:
        cursor.execute(query)
        db.close()
        return jsonify({'message': 'Tạo bài viết thành công'}), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400


@posts_bp.route('/posts/delete/<int:post_id>', methods=['POST'])
def delete_post(post_id):
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Unauthorized'}), 401

    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("DELETE FROM posts WHERE id=%s", (post_id,))
    db.close()
    return jsonify({'message': f'Đã xóa bài viết #{post_id}'}), 200


@posts_bp.route('/posts/<int:post_id>', methods=['PUT'])
def edit_post(post_id):
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    title = data.get('title', '')
    content = data.get('content', '')

    db = get_db_connection()
    cursor = db.cursor()
    
    # Check if post exists
    cursor.execute("SELECT * FROM posts WHERE id=%s", (post_id,))
    post = cursor.fetchone()
    if not post:
        db.close()
        return jsonify({'error': 'Bài viết không tồn tại'}), 404

    # Vulnerable SQL Injection / Direct interpolation
    query = f"UPDATE posts SET title='{title}', content='{content}' WHERE id={post_id}"
    try:
        cursor.execute(query)
        db.close()
        return jsonify({'message': 'Cập nhật bài viết thành công'}), 200
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400
