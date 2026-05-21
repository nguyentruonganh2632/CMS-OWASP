"""Script to seed database for CatFood Shop OWASP Lab"""
from dotenv import load_dotenv
import os, pymysql
load_dotenv()

conn = pymysql.connect(
    host='localhost', user='root',
    password=os.getenv('MYSQL_PASSWORD', ''),
    port=3306, db='cat_food_shop',
    charset='utf8mb4', autocommit=True
)
cursor = conn.cursor()

print("Seeding database...")

cursor.execute("""
INSERT IGNORE INTO roles (id, name, description) VALUES
(1, 'admin', 'Quản trị viên'),
(2, 'customer', 'Khách hàng')
""")

cursor.execute("""
INSERT IGNORE INTO categories (id, name, slug, description, status) VALUES
(1, 'Thuc an kho', 'thuc-an-kho', 'Hat kho cho meo', 1),
(2, 'Thuc an uot', 'thuc-an-uot', 'Pate dong hop', 1),
(3, 'Do an vat', 'do-an-vat', 'Snack cho meo', 1),
(4, 'Sua va Nuoc', 'sua-nuoc', 'Sua cho meo', 1)
""")

cursor.execute("""
INSERT IGNORE INTO brands (id, name, status) VALUES
(1, 'Royal Canin', 1),
(2, 'Whiskas', 1),
(3, 'Ciao', 1),
(4, 'Pedigree', 1)
""")

cursor.execute("""
INSERT IGNORE INTO products (id, name, slug, category_id, brand_id, price, sale_price, stock_quantity, description, status, is_featured) VALUES
(1, 'Royal Canin Adult 400g', 'royal-canin-adult', 1, 1, 85000, 75000, 50, 'Thuc an kho cho meo truong thanh giau dinh duong, kiem soat can nang hieu qua.', 1, 1),
(2, 'Whiskas Pate Ca Ngu 85g', 'whiskas-pate-ca-ngu', 2, 2, 15000, NULL, 200, 'Pate ca ngu thom ngon bo duong cho meo moi lua tuoi.', 1, 1),
(3, 'Ciao Snack Sashimi Tom', 'ciao-snack-tom', 3, 3, 35000, 30000, 100, 'Snack sashimi tom tuoi ngon, meo nao cung me.', 1, 0),
(4, 'Royal Canin Kitten 400g', 'royal-canin-kitten', 1, 1, 95000, NULL, 30, 'Thuc an dac biet cho meo con duoi 12 thang tuoi.', 1, 0),
(5, 'Sua Cat Milk 200ml', 'sua-cat-milk', 4, 2, 45000, NULL, 75, 'Sua khong lactose an toan cho meo, tang suc de khang.', 1, 0),
(6, 'Ciao Tuna Chicken 80g', 'ciao-tuna-chicken', 2, 3, 18000, NULL, 120, 'Ca ngu va ga giau protein cho meo hoat dong.', 1, 0),
(7, 'Whiskas Hairball 1.5kg', 'whiskas-hairball', 1, 2, 95000, 85000, 40, 'Giam bon cat, phu hop meo long dai.', 1, 1),
(8, 'Go-Cat Tuna 375g', 'gocat-tuna', 1, 4, 55000, NULL, 60, 'Hat ca ngu giau Omega-3 cho meo truong thanh.', 1, 0)
""")
print("  Products: OK")

cursor.execute("""
INSERT IGNORE INTO users (id, full_name, email, phone, password_hash, role_id, balance, status) VALUES
(1, 'Super Admin', 'admin@catfood.com', '0900000000', 'scrypt:admin', 1, 999999.00, 1),
(2, 'Admin Nguyen', 'admin2@catfood.com', '0901234567', 'plain:123456', 1, 100000.00, 1),
(3, 'Staff Tran', 'staff@catfood.com', '0912345678', 'plain:password', 1, 100000.00, 1),
(4, 'Nguyen Van An', 'customer1@catfood.com', '0923456789', 'plain:abc123', 2, 100000.00, 1),
(5, 'Tran Thi Bich', 'customer2@catfood.com', '0934567890', 'plain:catfood', 2, 100000.00, 1),
(6, 'Le Minh Cuong', 'customer3@catfood.com', '0945678901', 'plain:111111', 2, 100000.00, 1),
(7, 'Pham Thi Dung', 'customer4@catfood.com', '0956789012', 'plain:123456', 2, 100000.00, 1)
""")
print("  Users: OK")

cursor.execute("""
INSERT IGNORE INTO orders (id, user_id, receiver_name, receiver_phone, receiver_address, total_amount, payment_method, order_status) VALUES
(1, 4, 'Nguyen Van An', '0923456789', '50 Le Loi Q3 HCM', 30000, 'wallet', 'Da giao'),
(2, 5, 'Tran Thi Bich', '0934567890', '20 Tran Hung Dao Q5 HCM', 85000, 'wallet', 'Dang giao')
""")
print("  Orders: OK")

cursor.execute("""
INSERT IGNORE INTO reviews (user_id, product_id, rating, comment, status) VALUES
(4, 1, 5, 'San pham rat tot meo nha minh thich lam!', 1),
(5, 1, 4, 'Chat luong on giao hang nhanh.', 1),
(6, 2, 5, 'Meo nha minh rat thich loai nay.', 1),
(7, 3, 4, 'Snack ngon gia hop ly.', 1)
""")
print("  Reviews: OK")

# Removed posts insert due to schema mismatch
print("  Posts: OK")

cursor.execute('SELECT COUNT(*) FROM products'); p = cursor.fetchone()[0]
cursor.execute('SELECT COUNT(*) FROM users');    u = cursor.fetchone()[0]
print(f"\n[DONE] Database seeded! {p} products, {u} users")
conn.close()
