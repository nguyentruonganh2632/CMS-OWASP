import os
from dotenv import load_dotenv

# Load biến môi trường từ file .env nếu có
load_dotenv()

class Config:
    # Secret Key dùng để tạo Session và JWT Token
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-key-change-it-in-production'
    
    # Cấu hình MySQL
    MYSQL_HOST = os.environ.get('MYSQL_HOST') or 'localhost'
    MYSQL_USER = os.environ.get('MYSQL_USER') or 'root'
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD') or ''
    MYSQL_DB = os.environ.get('MYSQL_DB') or 'cat_food_shop'
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT') or 3306)
