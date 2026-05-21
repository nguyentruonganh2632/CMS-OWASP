import pymysql
import pymysql.cursors
from config import Config

def get_db_connection():
    """Tạo kết nối tới cơ sở dữ liệu MySQL"""
    try:
        connection = pymysql.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DB,
            port=Config.MYSQL_PORT,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor, # Trả về kết quả dạng Dictionary (Key-Value)
            autocommit=True
        )
        return connection
    except Exception as e:
        print(f"[DB] Connection error: {e}")
        return None
