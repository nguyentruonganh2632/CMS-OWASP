# Script kiểm tra & hướng dẫn setup DB
import pymysql

print("=" * 60)
print("CMS OWASP - Database Setup Check")
print("=" * 60)

try:
    conn = pymysql.connect(
        host='localhost', user='root', password='',
        port=3306, charset='utf8mb4'
    )
    print("[OK] Ket noi MySQL thanh cong!")
    cursor = conn.cursor()
    cursor.execute("SHOW DATABASES LIKE 'cat_food_shop'")
    db_exists = cursor.fetchone()
    if db_exists:
        print("[OK] Database 'cat_food_shop' da ton tai")
        cursor.execute("USE cat_food_shop")
        cursor.execute("SELECT COUNT(*) FROM products")
        count = cursor.fetchone()[0]
        print(f"[OK] Products: {count} san pham")
        if count == 0:
            print("[!] Chua co du lieu - chay lenh sau:")
            print("    mysql -u root cat_food_shop < database/seed_data.sql")
    else:
        print("[!] Database chua ton tai - chay:")
        print("    mysql -u root < database/init_db.sql")
        print("    mysql -u root cat_food_shop < database/seed_data.sql")
    conn.close()
except Exception as e:
    print(f"[FAIL] Khong ket noi duoc MySQL: {e}")
    print("\nGiai phap:")
    print("1. Kiem tra MySQL dang chay (XAMPP/WAMP/MySQL service)")
    print("2. Kiem tra password trong backend/config.py")
    print("   MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD') or 'YOUR_PASSWORD'")
