USE cat_food_shop;

-- Categories
INSERT IGNORE INTO categories (id, name, slug, description, status) VALUES
(1, 'Thuc an kho', 'thuc-an-kho', 'Hat kho cho meo cac loai', 1),
(2, 'Thuc an uot', 'thuc-an-uot', 'Pate va thuc an dong hop', 1),
(3, 'Do an vat', 'do-an-vat', 'Snack va banh thuong cho meo', 1),
(4, 'Sua & Nuoc uong', 'sua-nuoc-uong', 'Sua chuyen dung cho meo', 1);

-- Brands
INSERT IGNORE INTO brands (id, name, description, status) VALUES
(1, 'Royal Canin', 'Thuong hieu Phap cao cap', 1),
(2, 'Whiskas', 'Thuong hieu pho bien toan cau', 1),
(3, 'Ciao', 'Thuong hieu Nhat Ban', 1),
(4, 'Pedigree', 'Thuong hieu uy tin', 1);

-- Products (gia thap de khai thac race condition voi 100k)
INSERT IGNORE INTO products (id, name, slug, category_id, brand_id, price, sale_price, stock_quantity, description, status) VALUES
(1, 'Royal Canin Adult 400g', 'royal-canin-adult-400g', 1, 1, 85000, 75000, 50, 'Thuc an kho cho meo truong thanh, giau dinh duong, kiem soat can nang hieu qua.', 1),
(2, 'Whiskas Pate Ca Ngu 85g', 'whiskas-pate-ca-ngu', 2, 2, 15000, NULL, 200, 'Pate ca ngu thom ngon, bo duong cho meo moi lua tuoi.', 1),
(3, 'Ciao Snack Sashimi Tom', 'ciao-snack-sashimi-tom', 3, 3, 35000, 30000, 100, 'Snack sashimi tom tuoi ngon, meo nao cung me.', 1),
(4, 'Royal Canin Kitten 400g', 'royal-canin-kitten-400g', 1, 1, 95000, NULL, 30, 'Thuc an dac biet cho meo con duoi 12 thang tuoi.', 1),
(5, 'Sua Cat Milk 200ml', 'sua-cat-milk-200ml', 4, 2, 45000, NULL, 75, 'Sua khong lactose an toan cho meo, tang suc de khang.', 1),
(6, 'Ciao Tuna & Chicken 80g', 'ciao-tuna-chicken', 2, 3, 18000, NULL, 120, 'Ket hop ca ngu va ga, giau protein cho meo hoat dong.', 1),
(7, 'Whiskas Hairball 1.5kg', 'whiskas-hairball', 1, 2, 95000, 85000, 40, 'Cong thuc dac biet giam bon cat, phu hop meo long dai.', 1),
(8, 'Go-Cat Tuna 375g', 'gocat-tuna', 1, 4, 55000, NULL, 60, 'Thuc an hat ca ngu giau Omega-3 cho meo truong thanh.', 1);

-- Users voi balance 100,000 VND (password: 123456 dang plain text)
INSERT IGNORE INTO users (id, full_name, email, phone, password_hash, role_id, balance, status) VALUES
(2, 'Admin Nguyen', 'admin2@catfood.com', '0901234567', 'plain:123456', 1, 100000.00, 1),
(3, 'Staff Tran', 'staff@catfood.com', '0912345678', 'plain:password', 1, 100000.00, 1),
(4, 'Nguyen Van An', 'customer1@catfood.com', '0923456789', 'plain:abc123', 2, 100000.00, 1),
(5, 'Tran Thi Bich', 'customer2@catfood.com', '0934567890', 'plain:catfood', 2, 100000.00, 1),
(6, 'Le Minh Cuong', 'customer3@catfood.com', '0945678901', 'plain:111111', 2, 100000.00, 1),
(7, 'Pham Thi Dung', 'customer4@catfood.com', '0956789012', 'plain:123456', 2, 100000.00, 1);

-- Orders mau
INSERT IGNORE INTO orders (id, user_id, receiver_name, receiver_phone, receiver_address, total_amount, payment_method, order_status) VALUES
(1, 1, 'Super Admin', '0901111111', '100 Nguyen Hue, Q1, TP.HCM', 75000, 'wallet', 'Da giao'),
(2, 4, 'Nguyen Van An', '0923456789', '50 Le Loi, Q3, TP.HCM', 30000, 'wallet', 'Da giao'),
(3, 5, 'Tran Thi Bich', '0934567890', '20 Tran Hung Dao, Q5, TP.HCM', 85000, 'wallet', 'Dang giao');

-- Reviews (co stored XSS trong comment cuoi)
INSERT IGNORE INTO reviews (id, user_id, product_id, rating, comment, status) VALUES
(1, 4, 1, 5, 'San pham rat tot! Meo nha minh thich lam.', 1),
(2, 5, 1, 4, 'Chat luong on, giaohang nhanh.', 1),
(3, 6, 2, 5, 'Meo nha minh rat thich loai nay!', 1),
(4, 7, 3, 4, 'Snack ngon, gia hop ly.', 1);

-- Posts
INSERT IGNORE INTO posts (id, title, slug, content, author_id, status) VALUES
(1, 'Cach cham soc meo dung cach', 'cach-cham-soc-meo', 'Meo can duoc an dung gio va du dinh duong. Nen chon thuc an phu hop voi lua tuoi cua meo...', 1, 1),
(2, 'Top 5 thuc an tot nhat cho meo 2024', 'top-5-thuc-an-meo-2024', 'Danh gia cac san pham thuc an meo ban chay nhat tren thi truong hien nay...', 2, 1);
