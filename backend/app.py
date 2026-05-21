from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models.db import get_db_connection
from routes.auth import auth_bp
from routes.products import products_bp
from routes.posts import posts_bp
from routes.cart import cart_bp

app = Flask(__name__)
app.config.from_object(Config)

# ============================================================
# [VULN] A05: Security Misconfiguration - CORS quá rộng
# Cho phép TẤT CẢ origins, methods, headers
# FIX: Chỉ cho phép origin của frontend: origins=["http://localhost:5173"]
# ============================================================
CORS(app, origins="*", supports_credentials=True)

# Đăng ký các Blueprint
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(products_bp, url_prefix='/api')
app.register_blueprint(posts_bp, url_prefix='/api')
app.register_blueprint(cart_bp, url_prefix='/api')

@app.route('/api/health', methods=['GET'])
def health_check():
    db = get_db_connection()
    if db:
        db.close()
        return jsonify({"status": "success", "message": "Server đang chạy và kết nối DB thành công!"}), 200
    else:
        return jsonify({"status": "error", "message": "Server đang chạy nhưng không thể kết nối DB!"}), 500

if __name__ == '__main__':
    # ============================================================
    # [VULN] A05: Security Misconfiguration - Debug mode trên production
    # debug=True lộ stack trace, interactive debugger (thực thi code từ xa!)
    # FIX: debug=False trên production, dùng Gunicorn/uWSGI
    # ============================================================
    app.run(debug=True, port=5000, host='0.0.0.0')  # host='0.0.0.0' lộ ra mạng nội bộ!
