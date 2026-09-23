# CV website — hướng dẫn

Website CV cá nhân 1 trang (single-page), HTML5 + CSS3 + JavaScript thuần.
**Không framework, không build step, không npm.** Toàn bộ nội dung nằm trong `data.json`
và được render bằng JS — sửa nội dung không cần chạm vào HTML.

## Cấu trúc file

```
cv-website/
├── index.html            # khung trang + SEO meta + JSON-LD (không chứa nội dung CV)
├── styles.css            # toàn bộ style, màu/khoảng cách qua CSS custom properties
├── script.js             # render từ data.json + dark mode + form + animation
├── data.json             # ★ NỘI DUNG CV — sửa ở đây
├── assets/
│   ├── avatar-placeholder.svg   # ảnh đại diện mặc định — thay bằng ảnh thật của bạn
│   ├── favicon.svg
│   └── og-image.png             # ảnh share Facebook/LinkedIn (1200×630)
└── .github/workflows/deploy.yml # tự động deploy lên GitHub Pages khi push main
```

## 1. Sửa nội dung

Mở `data.json`, tìm mọi chỗ có `[CẦN ĐIỀN]` và thay bằng dữ liệu thật. Bản mặc định đã được
**định hướng cho vị trí BA/PO (Business Analyst / Product Owner)**: kỹ năng chia theo
nghiệp vụ & phương pháp / công cụ / kỹ năng mềm, kinh nghiệm theo lộ trình BA → Senior BA → PO,
chứng chỉ gợi ý PSPO I, CBAP/ECBA. Quy ước chỗ cần điền:

- `[CẦN ĐIỀN: ...]` — thông tin/danh tính thật (tên, email, công ty, trường, link…).
- `[X]`, `[Y]`, `[N]`, `[X%]` trong các bullet — **số liệu thật của bạn**. Đừng để nguyên con số
  trong ngoặc vuông khi gửi cho nhà tuyển dụng; mỗi bullet nên là một thành tích có số đo
  (trước → sau, %, thời gian, số người, số tính năng…).

| Mục trong `data.json` | Nội dung hiển thị |
|---|---|
| `profile` | Hero: tên, chức danh, tóm tắt, ảnh đại diện, email/điện thoại/địa điểm, link mạng xã hội |
| `about` | Section “Giới thiệu” + 3 ô số liệu nổi bật (`facts`) |
| `skills` | 3 nhóm kỹ năng (ngôn ngữ & framework / công cụ / kỹ năng mềm) |
| `experience` | Timeline kinh nghiệm làm việc |
| `projects` | Card dự án tiêu biểu + tech stack + link demo/source |
| `education`, `certificates` | Học vấn & chứng chỉ |
| `contact` | Thông tin liên hệ + ghi chú trên form |
| `footer` | Dòng bản quyền |

Vài điểm cần biết:

- **Skill dạng tag hay thanh %**: `"level": null` → hiện thành tag (khuyến nghị, không bịa số %).
  Muốn có thanh mức độ: `{ "name": "React", "level": 80 }` (số 0–100).
- **Link chưa có**: nếu giá trị không bắt đầu bằng `http`/`mailto`/`tel` (ví dụ `[CẦN ĐIỀN: link demo]`),
  trang sẽ hiển thị chữ mờ thay vì tạo link hỏng. Điền link thật → tự thành link.
- **Nút “Tải CV (PDF)”**: `profile.cvFile` để trống → nút mở hộp thoại **In** (chọn *Save as PDF*,
  đã có `@media print` canh sẵn 1–2 trang A4). Có file PDF thật → ghi đường dẫn, ví dụ
  `"cvFile": "cv/nguyen-van-a-cv.pdf"` (nhớ copy file vào thư mục `cv/`).
- **Ảnh đại diện**: thay `assets/avatar-placeholder.svg` bằng ảnh thật (nên là ảnh vuông ≥ 400×400,
  đặt cạnh file và sửa `profile.avatar`). Alt text sửa ở `profile.avatarAlt`.
- **Ảnh share (OG)**: `assets/og-image.png` 1200×630. Nếu đổi domain, sửa cả `og:url` /
  `og:image` / `canonical` trong `index.html` và hằng số `url` trong `script.js` (`syncMeta`).
- Các key bắt đầu bằng `_` (như `_huongDan`) chỉ là ghi chú, không được render.

## 2. Chạy thử ở máy

`data.json` được nạp bằng `fetch()` nên **mở trực tiếp file `index.html` sẽ lỗi** — cần chạy qua server tĩnh:

```bash
cd cv-website
python3 -m http.server 8000
# mở http://localhost:8000
```

Kiểm tra 3 kích thước: 360px (điện thoại), 768px (tablet), 1440px (desktop) — dùng DevTools (Cmd+Opt+I).

## 3. Deploy lên GitHub Pages

Cách 1 — tự động bằng workflow có sẵn (đang dùng cho repo này):

```bash
git init -b main
git add -A && git commit -m "CV website: hero, kỹ năng, kinh nghiệm, dự án, liên hệ"
gh repo create cv-website --public --source . --push
gh api repos/<username>/cv-website/pages -X POST -f build_type=workflow   # bật Pages
gh workflow run deploy.yml --repo <username>/cv-website                   # chạy lần đầu
gh run watch --repo <username>/cv-website                                 # xem tiến trình
```

Site live sau ~1 phút tại `https://<username>.github.io/cv-website/`.

Cách 2 — nhánh `main` + thư mục root (đơn giản nhất):
đẩy code lên nhánh `main`, vào **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.

## 4. Checklist trước khi gửi CV cho nhà tuyển dụng

- [ ] Đã thay hết `[CẦN ĐIỀN]` trong `data.json` (Ctrl/Cmd+F tìm chuỗi này).
- [ ] Mỗi mục kinh nghiệm có **3–5 bullet kèm số liệu** (trước → sau, %, thời gian, số người…).
- [ ] Link GitHub / LinkedIn / demo đã điền và bấm thử.
- [ ] Thay ảnh đại diện thật (đừng để ảnh placeholder).
- [ ] `profile.cvFile` đã trỏ tới file PDF thật (nếu muốn nút tải file) — hoặc để trống để dùng “In → Save as PDF”.
- [ ] Sửa `canonical` / `og:url` / `og:image` trong `index.html` nếu deploy ở domain khác.
- [ ] Kiểm tra in: Cmd+P → xem trước, chỉ 1–2 trang A4, không cắt giữa card.
- [ ] Kiểm tra dark mode (nút mặt trăng) và reload xem còn nhớ lựa chọn không.
- [ ] Chạy Lighthouse (DevTools → Lighthouse) — mục tiêu ≥ 95 cả 4 mục.

## 5. Ghi chú kỹ thuật
- **Dark mode**: nút bật/tắt ở header, lưu vào `localStorage` (`cv-theme`); lần đầu chưa chọn thì
  theo `prefers-color-scheme` của hệ điều hành.
- **In**: `@media print` đặt khổ A4, ẩn nút/nav/form, `break-inside: avoid` cho card & mục timeline.
- **Accessibility**: semantic HTML, skip-link, `aria-label` cho icon button, `:focus-visible` rõ,
  form có `aria-invalid` + thông báo lỗi, màu chữ đạt WCAG AA (accent trên nền sáng dùng `#0369A1`).
- **Animation**: fade/slide khi scroll bằng `IntersectionObserver`, tự tắt khi
  `prefers-reduced-motion: reduce`.
- **Form liên hệ**: chỉ validate phía client rồi mở `mailto:` (không có backend). Muốn gửi thật
  không cần email client: thay phần `submit` trong `script.js` bằng endpoint Formspree/Google Form.
- **SEO**: `title`/`description`/OG/Twitter/favicon/JSON-LD `schema.org/Person` — phần lớn được
  đồng bộ tự động từ `data.json` lúc tải trang; bản JSON-LD tĩnh trong `index.html` giữ vai trò dự phòng.

## 6. Kiểm thử tự động (không cần cài gì)

Bộ test headless Chrome + CDP nằm trong `tools/`, không dùng Puppeteer/npm. Chạy:

```bash
# 1) mở Chrome ở chế độ test (một lần)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --disable-gpu --no-first-run --remote-debugging-port=9222 \
  --user-data-dir=/tmp/cdp-cv-profile "http://localhost:8000/" &

# 2) chạy test trên bản local
python3 -m http.server 8000 &     # nếu chưa chạy
node tools/verify.mjs             # kết quả: N pass / M fail + ảnh trong tools/shots/

# hoặc test thẳng bản LIVE trên GitHub Pages
BASE=https://tuanlee101.github.io/cv-website/ node tools/verify.mjs
```

Bộ test kiểm tra thật: render đủ số phần tử từ `data.json`, dark mode + `localStorage` (click → đổi màu → reload vẫn nhớ),
validate form (bỏ trống, email sai, hợp lệ), `@media print` (ẩn nav/nút/form, chữ đen nền trắng, không cắt card),
responsive 360/768/1440 (không tràn ngang, đúng số cột), tương phản màu WCAG AA cho cả 2 theme, không lỗi JS/404.
`tools/make-og-image.sh` sinh lại `assets/og-image.png` (1200×630) từ `tools/og-template.html`.

Nguồn ý tưởng yêu cầu: `prompt-website-cv.md` (prompt gốc dùng để sinh dự án này).
