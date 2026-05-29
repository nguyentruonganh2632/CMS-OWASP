# 🐱 CatFood Shop CMS - OWASP Vulnerability Lab

Một hệ thống quản trị nội dung (CMS) mô phỏng một cửa hàng bán đồ ăn cho mèo. Dự án này được thiết kế như một **môi trường thực hành bảo mật (Vulnerable Lab)**, cố tình chứa các lỗ hổng bảo mật phổ biến thuộc danh sách **OWASP Top 10** nhằm mục đích phục vụ nghiên cứu, học tập và rèn luyện kỹ năng kiểm thử xâm nhập (Penetration Testing).

⚠️ **CẢNH BÁO:** Không triển khai dự án này trên môi trường Production hoặc mạng công cộng (Public Internet) dưới bất kỳ hình thức nào. Hệ thống cố ý chứa các lỗ hổng có thể dẫn đến việc chiếm quyền kiểm soát máy chủ hoàn toàn (RCE).

## 🚀 Kiến trúc hệ thống
Dự án được xây dựng theo mô hình Microservices và được đóng gói hoàn toàn bằng Docker.
* **Frontend:** React.js (Vite) + Tailwind CSS, triển khai qua Nginx.
* **Backend:** Python Flask (RESTful API).
* **Database:** MySQL 8.0.

## 🛠️ Hướng dẫn cài đặt và chạy dự án

### Yêu cầu hệ thống:
* Đã cài đặt [Docker](https://docs.docker.com/get-docker/) và [Docker Compose](https://docs.docker.com/compose/install/).

### Các bước khởi chạy:
1. **Clone dự án:**
   ```bash
   git clone https://github.com/nguyentruonganh2632/CMS-OWASP.git
   cd CMS-OWASP
   ```

2. **Cấu hình môi trường (Không bắt buộc):**
   Bạn có thể sao chép tệp `.env.example` thành `.env` nếu muốn tinh chỉnh mật khẩu cơ sở dữ liệu. Mặc định Docker Compose đã cấu hình sẵn.

3. **Khởi chạy bằng Docker Compose:**
   ```bash
   docker-compose up --build -d
   ```
   *Quá trình này có thể mất vài phút cho lần chạy đầu tiên để tải các Docker image và cài đặt thư viện.*

4. **Truy cập ứng dụng:**
   * Giao diện Website (Frontend): `http://localhost:3000`
   * Backend API: `http://localhost:5000`

## 🔑 Tài khoản mặc định (Mock Data)
Khi hệ thống khởi chạy lần đầu, tệp `seed.py` sẽ tự động tạo sẵn dữ liệu và các tài khoản sau để bạn thực hành:

| Vai trò | Email | Mật khẩu (Plain text) |
| :--- | :--- | :--- |
| **Super Admin** | `admin@catfood.com` | *Lỗ hổng (Trống/Bypass SQLi)* |
| **Admin** | `admin2@catfood.com` | `123456` |
| **Staff** | `staff@catfood.com` | `password` |
| **Khách hàng 1** | `customer1@catfood.com`| `abc123` |
| **Khách hàng 2** | `customer2@catfood.com`| `catfood` |

## 🐞 Danh sách các lỗ hổng hiện có (Spoilers)
Dự án bao gồm 12 nhóm lỗ hổng thực tế để khai thác:
1. SQL Injection (Bypass Regex Filtering)
2. Cross-Site Scripting (Stored & Reflected XSS)
3. IDOR / BOLA (Broken Object Level Authorization)
4. Mass Assignment / BFLA (Nâng quyền)
5. JWT Algorithm Confusion (Bypass Signature)
6. XML External Entity (XXE) Injection
7. Server-Side Template Injection (SSTI)
8. Blind OS Command Injection
9. Local File Inclusion (LFI) & Path Traversal Bypass
10. Server-Side Request Forgery (SSRF)
11. Race Condition (Lỗi Logic khi thanh toán)
12. Security Misconfiguration (Lỗi hiển thị lỗi, CORS mở)

## 📖 Mục đích giáo dục
Toàn bộ mã nguồn, lỗ hổng và dữ liệu trong dự án này đều được tạo ra hoàn toàn cho mục đích giáo dục. Vui lòng không áp dụng bất kỳ kỹ thuật khai thác nào học được từ dự án này vào các hệ thống thực tế khi chưa có sự cho phép bằng văn bản của chủ sở hữu hệ thống.
