"""
Products, Orders, Purchase routes - CatFood Shop CMS
"""

from flask import Blueprint, request, jsonify
import jwt
import os
import time
from models.db import get_db_connection
from config import Config

products_bp = Blueprint('products', __name__)


def get_current_user(req):
    token = req.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return None
    try:
        # Lỗ hổng JWT: Cho phép thuật toán "none" (Algorithm Confusion)
        return jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256', 'none'], options={"verify_signature": False} if jwt.get_unverified_header(token).get('alg') == 'none' else {})
    except:
        return None


# ─── ORDERS ───────────────────────────────────────────────
@products_bp.route('/orders', methods=['GET'])
def get_orders():
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Unauthorized'}), 401

    # IDOR nâng cấp: Phải dùng UUID thay vì user_id dễ đoán
    uuid = request.args.get('uuid')
    
    db = get_db_connection()
    cursor = db.cursor()
    
    if uuid:
        # Nếu có truyền UUID, cố tình lấy đơn hàng theo UUID đó (lỗ hổng IDOR)
        query = f"SELECT o.* FROM orders o JOIN users u ON o.user_id = u.id WHERE u.uuid='{uuid}' ORDER BY o.created_at DESC"
    else:
        # Mặc định lấy theo tài khoản đang đăng nhập
        query = f"SELECT * FROM orders WHERE user_id={current['user_id']} ORDER BY created_at DESC"
        
    cursor.execute(query)
    orders = cursor.fetchall()
    db.close()
    return jsonify({'orders': orders}), 200


# ─── PRODUCTS ─────────────────────────────────────────────
@products_bp.route('/search', methods=['GET'])
def search_products():
    q = request.args.get('q', '')
    
    # Nâng cấp độ khó: Chặn comment đơn giản để bắt buộc dùng kỹ thuật đóng nháy và OR/AND
    if '--' in q or '#' in q or '/*' in q:
        return jsonify({'error': 'Phát hiện ký tự nghi vấn trong từ khóa tìm kiếm!'}), 400

    db = get_db_connection()
    cursor = db.cursor()
    # Vulnerable: direct string interpolation with LEFT JOIN to fetch actual category and brand names
    query = f"""
        SELECT p.*, c.name AS category_name, b.name AS brand_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.status=1 AND (p.name LIKE '%{q}%' OR p.description LIKE '%{q}%')
    """
    try:
        cursor.execute(query)
        products = cursor.fetchall()
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400
    db.close()
    return jsonify({'products': products, 'query': q}), 200


@products_bp.route('/products', methods=['GET'])
def get_products():
    db = get_db_connection()
    cursor = db.cursor()
    query = """
        SELECT p.*, c.name AS category_name, b.name AS brand_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.status=1 
        ORDER BY p.is_featured DESC, p.created_at DESC
    """
    cursor.execute(query)
    products = cursor.fetchall()
    db.close()
    return jsonify({'products': products}), 200


@products_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    db = get_db_connection()
    cursor = db.cursor()
    query = f"""
        SELECT p.*, c.name AS category_name, b.name AS brand_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.id={product_id}
    """
    cursor.execute(query)
    product = cursor.fetchone()
    db.close()
    if not product:
        return jsonify({'error': 'Sản phẩm không tồn tại'}), 404
    return jsonify({'product': product}), 200


@products_bp.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    # Lỗ hổng: Không kiểm tra quyền (Missing Auth)
    data = request.get_json()
    price = data.get('price')
    stock_quantity = data.get('stock_quantity')
    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("UPDATE products SET price=%s, stock_quantity=%s WHERE id=%s", (price, stock_quantity, product_id))
        db.close()
        return jsonify({'message': 'Đã cập nhật sản phẩm'}), 200
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400


@products_bp.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    # Lỗ hổng: Không kiểm tra quyền (Missing Auth)
    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM cart_items WHERE product_id=%s", (product_id,))
        cursor.execute("DELETE FROM reviews WHERE product_id=%s", (product_id,))
        cursor.execute("DELETE FROM products WHERE id=%s", (product_id,))
        db.close()
        return jsonify({'message': 'Đã xóa sản phẩm'}), 200
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400


@products_bp.route('/products', methods=['POST'])
def create_product():
    # No authentication check
    data = request.get_json()
    name = data.get('name', '')
    price = data.get('price', 0)
    sale_price = data.get('sale_price', '')
    description = data.get('description', '')
    category_id = data.get('category_id', 1)
    stock_quantity = data.get('stock_quantity', 10)

    sale_price_val = sale_price if sale_price else 'NULL'

    import re
    import time
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()) + f'-{int(time.time())}'

    db = get_db_connection()
    cursor = db.cursor()
    query = f"""
        INSERT INTO products (name, slug, price, sale_price, description, category_id, stock_quantity, status, is_featured, created_at, updated_at)
        VALUES ('{name}', '{slug}', {price}, {sale_price_val}, '{description}', {category_id}, {stock_quantity}, 1, 0, NOW(), NOW())
    """
    try:
        cursor.execute(query)
        db.close()
        return jsonify({'message': 'Tạo sản phẩm thành công'}), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400


# ─── PURCHASE (Race Condition Vulnerable) ─────────────────
@products_bp.route('/purchase', methods=['POST'])
def purchase():
    """
    Mua hang bang vi dien tu.
    Race Condition: Khong dung transaction hoac SELECT FOR UPDATE.
    Gui nhieu request dong thoi -> so du am.
    """
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Vui lòng đăng nhập để mua hàng'}), 401

    data = request.get_json()
    product_id = data.get('product_id')
    quantity = int(data.get('quantity', 1))

    if not product_id or quantity < 1:
        return jsonify({'error': 'Dữ liệu không hợp lệ'}), 400

    db = get_db_connection()
    cursor = db.cursor()

    # Step 1: Get product price
    cursor.execute("SELECT * FROM products WHERE id=%s AND status=1", (product_id,))
    product = cursor.fetchone()
    if not product:
        db.close()
        return jsonify({'error': 'Sản phẩm không tồn tại'}), 404

    # Logic Flaw (Price Manipulation): Nếu frontend gửi lên giá, server tin tưởng và lấy luôn giá đó
    client_price = data.get('price')
    if client_price is not None:
        price = float(client_price)
    else:
        price = float(product['sale_price'] or product['price'])
        
    total = price * quantity

    # Step 2: Check balance  (RACE CONDITION WINDOW STARTS HERE)
    cursor.execute("SELECT balance, full_name FROM users WHERE id=%s", (current['user_id'],))
    user = cursor.fetchone()
    current_balance = float(user['balance'])

    if current_balance < total:
        db.close()
        return jsonify({
            'error': f'Số dư không đủ. Cần {total:,.0f}đ, hiện có {current_balance:,.0f}đ'
        }), 400

    # Simulate processing delay - widens race condition window
    time.sleep(0.3)

    # Step 3: Deduct balance (NO LOCKING - vulnerable!)
    cursor.execute(
        "UPDATE users SET balance = balance - %s WHERE id=%s",
        (total, current['user_id'])
    )

    # Step 4: Create order
    cursor.execute("""
        INSERT INTO orders (user_id, receiver_name, receiver_phone, receiver_address, total_amount, payment_method, order_status, created_at)
        VALUES (%s, %s, %s, %s, %s, 'wallet', 'Cho xac nhan', NOW())
    """, (
        current['user_id'],
        user['full_name'],
        data.get('phone', ''),
        data.get('address', 'Dia chi mac dinh'),
        total
    ))
    order_id = cursor.lastrowid

    cursor.execute("""
        INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
        VALUES (%s, %s, %s, %s, %s)
    """, (order_id, product_id, quantity, price, total))

    db.close()

    # Get updated balance
    db2 = get_db_connection()
    c2 = db2.cursor()
    c2.execute("SELECT balance FROM users WHERE id=%s", (current['user_id'],))
    new_balance = float(c2.fetchone()['balance'])
    db2.close()

    return jsonify({
        'message': f'Đặt hàng thành công! Mã đơn #{order_id}',
        'order_id': order_id,
        'amount_paid': total,
        'balance_before': current_balance,
        'balance_after': new_balance,
    }), 201


# ─── PROFILE ──────────────────────────────────────────────
@products_bp.route('/profile', methods=['PUT'])
def update_profile():
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    user_id = current['user_id']

    # Mass assignment: accepts all fields from request body
    set_clauses = []
    for key, value in data.items():
        set_clauses.append(f"{key}='{value}'")

    if not set_clauses:
        return jsonify({'error': 'Không có dữ liệu để cập nhật'}), 400

    db = get_db_connection()
    cursor = db.cursor()
    try:
        query = f"UPDATE users SET {', '.join(set_clauses)} WHERE id={user_id}"
        cursor.execute(query)
        db.close()
        return jsonify({'message': 'Cập nhật thành công'}), 200
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400


# ─── ADMIN ────────────────────────────────────────────────
@products_bp.route('/admin/users', methods=['GET'])
def get_all_users():
    # No authentication check
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT id, full_name, email, phone, password_hash, role_id, balance, created_at FROM users")
    users = cursor.fetchall()
    db.close()
    for u in users:
        if u.get('balance'):
            u['balance'] = float(u['balance'])
    return jsonify({'users': users}), 200

@products_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    # Lỗ hổng: Xóa user không cần check quyền
    if user_id == 1:
        return jsonify({'error': 'Không thể xóa Super Admin!'}), 403
    db = get_db_connection()
    cursor = db.cursor()
    try:
        try:
            cursor.execute("DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id=%s)", (user_id,))
        except Exception:
            pass
        try:
            cursor.execute("DELETE FROM carts WHERE user_id=%s", (user_id,))
        except Exception:
            pass
        try:
            cursor.execute("DELETE FROM reviews WHERE user_id=%s", (user_id,))
        except Exception:
            pass
        try:
            cursor.execute("DELETE FROM posts WHERE author_id=%s", (user_id,))
        except Exception:
            pass
        try:
            cursor.execute("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id=%s)", (user_id,))
        except Exception:
            pass
        try:
            cursor.execute("DELETE FROM orders WHERE user_id=%s", (user_id,))
        except Exception:
            pass
        
        cursor.execute("DELETE FROM users WHERE id=%s", (user_id,))
        db.commit()
        db.close()
        return jsonify({'message': 'Đã xóa người dùng'}), 200
    except Exception as e:
        db.rollback()
        db.close()
        return jsonify({'error': f'Lỗi CSDL: {str(e)}'}), 500

@products_bp.route('/admin/users/<int:user_id>/money', methods=['POST'])
def add_money_to_user(user_id):
    # Lỗ hổng: Bơm tiền tùy ý không cần check quyền
    data = request.get_json()
    amount = float(data.get('amount', 100000))
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("UPDATE users SET balance = balance + %s WHERE id=%s", (amount, user_id))
    db.close()
    return jsonify({'message': f'Đã bơm {amount} đ cho user #{user_id}'}), 200


@products_bp.route('/debug/config', methods=['GET'])
def debug_config():
    return jsonify({
        'SECRET_KEY': Config.SECRET_KEY,
        'MYSQL_HOST': Config.MYSQL_HOST,
        'MYSQL_USER': Config.MYSQL_USER,
        'MYSQL_PASSWORD': Config.MYSQL_PASSWORD,
        'MYSQL_DB': Config.MYSQL_DB,
        'ENV': 'production',
        'DEBUG': True,
    }), 200

import subprocess
import pickle
import base64

@products_bp.route('/admin/backup/import', methods=['POST'])
def import_backup():
    """
    Tính năng Import Backup DÀNH RIÊNG CHO SUPER ADMIN.
    Lỗ hổng: Insecure Deserialization (A08:2021).
    """
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Unauthorized'}), 401
        
    # Phân quyền chặt chẽ: Chỉ đúng Super Admin (role_id=1) mới được dùng!
    if current.get('role_id') != 1:
        return jsonify({'error': 'Forbidden: Chỉ Super Admin mới được phép dùng chức năng này!'}), 403

    data = request.get_json()
    backup_data = data.get('data', '')
    
    if not backup_data:
        return jsonify({'error': 'Dữ liệu backup trống'}), 400
        
    try:
        # Cực kỳ nguy hiểm: Giải mã Base64 và dùng pickle.loads để khôi phục Object
        decoded_data = base64.b64decode(backup_data)
        obj = pickle.loads(decoded_data)
        return jsonify({'message': 'Import backup thành công!', 'data_type': str(type(obj))}), 200
    except Exception as e:
        return jsonify({'error': f'Lỗi import: {str(e)}'}), 400


from flask import render_template_string
from lxml import etree

@products_bp.route('/orders/<int:order_id>/invoice', methods=['GET'])
def get_invoice(order_id):
    """
    Tính năng xem hóa đơn (SSTI - Server-Side Template Injection).
    """
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Unauthorized'}), 401

    custom_title = request.args.get('title', 'HOA DON THANH TOAN')
    
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM orders WHERE id=%s", (order_id,))
    order = cursor.fetchone()
    db.close()
    
    if not order:
        return jsonify({'error': 'Đơn hàng không tồn tại'}), 404
        
    # Vulnerable Jinja2 Template rendering
    # Nối chuỗi trực tiếp tham số user-input vào template string!
    template = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #fff; background: #0b0f19;">
        <h2>{custom_title}</h2>
        <hr/>
        <p><b>Ma don:</b> #{order['id']}</p>
        <p><b>Nguoi nhan:</b> {order['receiver_name']}</p>
        <p><b>Dia chi:</b> {order['receiver_address']}</p>
        <p><b>Tong tien:</b> {float(order['total_amount'])} VND</p>
        <p><b>Trang thai:</b> {order['order_status']}</p>
    </div>
    """
    try:
        return render_template_string(template), 200
    except Exception as e:
        return f"Lỗi render: {str(e)}", 500


@products_bp.route('/orders/import-xml', methods=['POST'])
def import_orders_xml():
    """
    Tính năng Import đơn hàng bằng XML (XXE - XML External Entity).
    """
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Unauthorized'}), 401

    xml_data = request.data
    if not xml_data:
        return jsonify({'error': 'Dữ liệu XML trống'}), 400

    try:
        # Cấu hình parser bị lỗi XXE (cho phép resolve external entities)
        parser = etree.XMLParser(resolve_entities=True, no_network=False)
        root = etree.fromstring(xml_data, parser=parser)
        
        receiver_name = root.findtext('receiver_name')
        receiver_phone = root.findtext('receiver_phone')
        receiver_address = root.findtext('receiver_address')
        total_amount = root.findtext('total_amount')
        
        # Trả về kết quả hiển thị thông tin đơn hàng đã parse thành công
        # Nếu có XXE payload, nội dung file nhạy cảm sẽ hiển thị ở đây!
        return jsonify({
            'message': 'Đọc dữ liệu XML thành công!',
            'data': {
                'receiver_name': receiver_name,
                'receiver_phone': receiver_phone,
                'receiver_address': receiver_address,
                'total_amount': total_amount
            }
        }), 200
    except Exception as e:
        return jsonify({'error': f'Lỗi parse XML: {str(e)}'}), 400


@products_bp.route('/admin/ping', methods=['POST'])
def ping_host():
    """
    Công cụ chẩn đoán mạng cho Admin.
    Lỗ hổng nâng cấp: Blind OS Command Injection (Chạy ngầm).
    """
    data = request.get_json()
    ip = data.get('ip', '127.0.0.1')
    
    # Chạy ngầm trong Thread khác để tạo mù (Blind)
    import threading
    def run_ping():
        try:
            subprocess.check_output(f"ping -n 2 {ip}", shell=True, stderr=subprocess.STDOUT)
        except:
            pass
            
    threading.Thread(target=run_ping).start()
    return jsonify({'result': 'Đã gửi lệnh ping. Vui lòng kiểm tra server nhận để biết kết quả (OOB).'}), 200


@products_bp.route('/files', methods=['GET'])
def get_file():
    """
    Đọc file từ thư mục uploads.
    Lỗ hổng: Local File Inclusion (LFI) / Path Traversal do không filter '../'
    """
    filename = request.args.get('name')
    if not filename:
        return jsonify({'error': 'Missing filename parameter'}), 400
        
    # Nâng cấp: Thêm bộ lọc "nửa mùa" và nối đuôi .png
    if '../' in filename:
        filename = filename.replace('../', '') # Bypass bằng ....//
        
    if not filename.endswith('.png'):
        filename += '.png' # Bypass bằng Null Byte %00
        
    filepath = os.path.join(os.path.dirname(__file__), '..', 'uploads', filename)
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
        return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
    except Exception as e:
        return jsonify({'error': str(e)}), 404


@products_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Không có file'}), 400
    file = request.files['file']
    filename = file.filename
    upload_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)
    return jsonify({'message': 'Upload thành công', 'path': filepath}), 200


@products_bp.route('/fetch-preview', methods=['POST'])
def fetch_url_preview():
    data = request.get_json()
    url = data.get('url', '')
    if not url:
        return jsonify({'error': 'URL không được để trống'}), 400
        
    # Nâng cấp SSRF: Bộ lọc kiểm tra URL phải bắt đầu bằng https://google.com
    if not url.startswith('https://google.com'):
        return jsonify({'error': 'Chỉ cho phép lấy trước từ https://google.com'}), 400
        
    try:
        import urllib.request
        with urllib.request.urlopen(url, timeout=5) as response:
            content = response.read(2048).decode('utf-8', errors='ignore')
        return jsonify({'content': content, 'url': url}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ─── ADMIN ORDERS (Lỗ hổng BOLA / Phân quyền) ───────────────
@products_bp.route('/admin/orders', methods=['GET'])
def admin_get_orders():
    """
    Lấy danh sách tất cả đơn hàng trong hệ thống (Dành cho trang Admin).
    Lỗ hổng: BOLA/IDOR - Không kiểm tra role_id thực tế của người dùng.
    """
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Vui lòng đăng nhập'}), 401
        
    db = get_db_connection()
    cursor = db.cursor()
    query = """
        SELECT o.*, u.full_name AS customer_name 
        FROM orders o 
        JOIN users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC
    """
    cursor.execute(query)
    orders = cursor.fetchall()
    db.close()
    return jsonify({'orders': orders}), 200


@products_bp.route('/admin/orders/<int:order_id>/status', methods=['POST'])
def admin_update_order_status(order_id):
    """
    Cập nhật trạng thái đơn hàng (Duyệt, Hủy, Hoàn thành...).
    Lỗ hổng: Thiếu kiểm tra quyền hạn (Missing Function Level Access Control).
    """
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Vui lòng đăng nhập'}), 401
        
    data = request.get_json()
    new_status = data.get('status')
    if not new_status:
        return jsonify({'error': 'Trạng thái mới không hợp lệ'}), 400
        
    db = get_db_connection()
    cursor = db.cursor()
    
    cursor.execute("SELECT * FROM orders WHERE id=%s", (order_id,))
    order = cursor.fetchone()
    if not order:
        db.close()
        return jsonify({'error': 'Đơn hàng không tồn tại'}), 404
        
    cursor.execute("UPDATE orders SET order_status=%s WHERE id=%s", (new_status, order_id))
    db.close()
    return jsonify({'message': f'Cập nhật trạng thái đơn hàng #{order_id} thành "{new_status}" thành công!'}), 200
