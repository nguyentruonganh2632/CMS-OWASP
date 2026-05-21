from flask import Blueprint, request, jsonify
from models.db import get_db_connection
from routes.products import get_current_user
import time

cart_bp = Blueprint('cart', __name__)

@cart_bp.route('/cart', methods=['GET'])
def get_cart():
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Lỗ hổng IDOR nâng cấp: Dùng UUID thay vì user_id
    uuid = request.args.get('uuid')
    
    db = get_db_connection()
    cursor = db.cursor()
    
    if uuid:
        # Lấy cart_id của UUID đó
        cursor.execute("SELECT c.id FROM carts c JOIN users u ON c.user_id = u.id WHERE u.uuid=%s", (uuid,))
    else:
        # Tìm cart của user hiện tại
        cursor.execute("SELECT id FROM carts WHERE user_id=%s", (current['user_id'],))
        
    cart = cursor.fetchone()
    if not cart:
        return jsonify({'items': [], 'total': 0}), 200
        
    cart_id = cart['id']
    
    # Lấy items
    query = """
        SELECT ci.id as cart_item_id, ci.quantity, p.id as product_id, p.name, p.sale_price, p.price, p.slug
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = %s
    """
    cursor.execute(query, (cart_id,))
    items = cursor.fetchall()
    db.close()
    
    total = 0
    for item in items:
        actual_price = float(item['sale_price'] or item['price'])
        item['actual_price'] = actual_price
        total += actual_price * item['quantity']
        
    return jsonify({'items': items, 'total': total, 'cart_id': cart_id}), 200

@cart_bp.route('/cart/add', methods=['POST'])
def add_to_cart():
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = int(data.get('quantity', 1))
    
    if quantity < 1:
        return jsonify({'error': 'Số lượng không hợp lệ'}), 400
        
    db = get_db_connection()
    cursor = db.cursor()
    
    try:
        # Tìm hoặc tạo cart
        cursor.execute("SELECT id FROM carts WHERE user_id=%s", (current['user_id'],))
        cart = cursor.fetchone()
        if not cart:
            cursor.execute("INSERT INTO carts (user_id) VALUES (%s)", (current['user_id'],))
            cart_id = cursor.lastrowid
        else:
            cart_id = cart['id']
            
        # Check if product exists in cart
        cursor.execute("SELECT id, quantity FROM cart_items WHERE cart_id=%s AND product_id=%s", (cart_id, product_id))
        item = cursor.fetchone()
        
        if item:
            cursor.execute("UPDATE cart_items SET quantity = quantity + %s WHERE id=%s", (quantity, item['id']))
        else:
            cursor.execute("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (%s, %s, %s)", (cart_id, product_id, quantity))
            
        db.close()
        return jsonify({'message': 'Đã thêm vào giỏ hàng'}), 200
    except Exception as e:
        db.close()
        # Trả về lỗi rõ ràng nếu user_id không tồn tại trong DB (do token cũ chưa xóa)
        return jsonify({'error': 'Tài khoản không tồn tại hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!'}), 400

@cart_bp.route('/cart/remove/<int:item_id>', methods=['DELETE'])
def remove_from_cart(item_id):
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Unauthorized'}), 401
    
    db = get_db_connection()
    cursor = db.cursor()
    # Lỗ hổng IDOR: Xóa item không check xem nó có thuộc về cart của user hiện tại không
    cursor.execute("DELETE FROM cart_items WHERE id=%s", (item_id,))
    db.close()
    return jsonify({'message': 'Đã xóa khỏi giỏ hàng'}), 200

@cart_bp.route('/cart/checkout', methods=['POST'])
def checkout_cart():
    """
    Thanh toán giỏ hàng.
    Lỗ hổng: Race Condition.
    """
    current = get_current_user(request)
    if not current:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.get_json()
    db = get_db_connection()
    cursor = db.cursor()
    
    # Lấy thông tin user
    cursor.execute("SELECT balance, full_name FROM users WHERE id=%s", (current['user_id'],))
    user = cursor.fetchone()
    current_balance = float(user['balance'])
    
    # Lấy thông tin giỏ hàng
    cursor.execute("SELECT id FROM carts WHERE user_id=%s", (current['user_id'],))
    cart = cursor.fetchone()
    if not cart:
        db.close()
        return jsonify({'error': 'Giỏ hàng trống'}), 400
        
    cart_id = cart['id']
    cursor.execute("""
        SELECT ci.quantity, p.id as product_id, p.sale_price, p.price
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = %s
    """, (cart_id,))
    items = cursor.fetchall()
    
    if not items:
        db.close()
        return jsonify({'error': 'Giỏ hàng trống'}), 400
        
    total = 0
    for item in items:
        actual_price = float(item['sale_price'] or item['price'])
        total += actual_price * item['quantity']
        
    # Check balance
    if current_balance < total:
        db.close()
        return jsonify({'error': f'Số dư không đủ. Cần {total:,.0f}đ, hiện có {current_balance:,.0f}đ'}), 400
        
    # RACE CONDITION WINDOW (Delay)
    time.sleep(0.3)
    
    # Deduct balance
    cursor.execute(
        "UPDATE users SET balance = balance - %s WHERE id=%s",
        (total, current['user_id'])
    )
    
    # Create order
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
    
    # Create order items
    for item in items:
        actual_price = float(item['sale_price'] or item['price'])
        subtotal = actual_price * item['quantity']
        cursor.execute("""
            INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
            VALUES (%s, %s, %s, %s, %s)
        """, (order_id, item['product_id'], item['quantity'], actual_price, subtotal))
        
    # Xóa giỏ hàng
    cursor.execute("DELETE FROM cart_items WHERE cart_id=%s", (cart_id,))
    
    db.close()
    
    return jsonify({
        'message': f'Đặt hàng thành công! Mã đơn #{order_id}',
        'order_id': order_id,
        'amount_paid': total
    }), 201
