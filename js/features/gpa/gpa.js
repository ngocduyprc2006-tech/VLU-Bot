/**
 * FILE: js/features/gpa/gpa.js
 * CẬP NHẬT: Tự động nạp quy chế đào tạo từ file txt hệ thống,
 * dựng bảng điểm sinh viên trực quan và cấu hình trợ lý mini bot panel phải.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("🎓 Module GPA Results: Đang khởi chạy...");

    // 1. TỰ ĐỘNG NẠP FILE VĂN BẢN QUY CHẾ ĐIỂM LÊN PANEL TRÁI
    const gpaKnowledgeUrl = '/VLU-Chatbot/knowledge/khungK30.txt';
    
    fetch(gpaKnowledgeUrl)
        .then(res => {
            if (res.ok) return res.text();
            throw new Error("Không tìm thấy file quy chế đào tạo.");
        })
        .then(textData => {
            const displayBox = document.getElementById('knowledgeContent');
            if (displayBox && textData) {
                // Xóa chữ "Đang tải..." và thay bằng dữ liệu file txt quy chế
                displayBox.innerText = textData;
            }
        })
        .catch(err => {
            console.error("Lưu ý: Chưa nạp được nội dung text quy chế điểm bổ sung.");
        });

    // 2. DỰNG BẢNG ĐIỂM SINH VIÊN TRỰC QUAN (HIỂN THỊ PHÍA TRÊN FILE TEXT)
    initGpaTable();

    // 3. KHỞI ĐỘNG CỔNG CHAT TRỢ LÝ TÍNH ĐIỂM BÊN PANEL PHẢI
    initGpaMiniBot();
});

function initGpaTable() {
    const displayBox = document.getElementById('knowledgeContent');
    if (!displayBox) return;

    // Tạo một vùng bảng điểm mẫu để chèn trước phần nội dung text thuần quy chế
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'gpa-table-wrapper';
    tableWrapper.style.marginBottom = '20px';
    
    tableWrapper.innerHTML = `
        <table class="vlu-table" style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px;">
            <thead>
                <tr style="background-color: #f1f3f4;">
                    <th style="border: 1px solid #e1e4e6; padding: 10px; text-align: left;">Tên môn học</th>
                    <th style="border: 1px solid #e1e4e6; padding: 10px; text-align: center;">Số TC</th>
                    <th style="border: 1px solid #e1e4e6; padding: 10px; text-align: center;">Điểm hệ 10</th>
                    <th style="border: 1px solid #e1e4e6; padding: 10px; text-align: center;">Điểm chữ</th>
                    <th style="border: 1px solid #e1e4e6; padding: 10px; text-align: center;">Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #e1e4e6; padding: 10px;">Cấu trúc dữ liệu và Giải thuật</td>
                    <td style="border: 1px solid #e1e4e6; padding: 10px; text-align: center;">3</td>
                    <td style="border: 1px solid #e1e4e6; padding: 10px; text-align: center;">7.8</td>
                    <td style="border: 1px solid #e1e4e6; padding: 10px; text-align: center; font-weight: 600;">B+</td>
                    <td style="border: 1px solid #e1e4e6; padding: 10px; text-align: center; color: #28a745;">Đạt (Pass)</td>
                </tr>
                <tr class="warning-row" style="background-color: #fff5f5; color: #e00000;">
                    <td style="border: 1px solid #e1e4e6; padding: 10px;">Toán rời rạc</td>
                    <td style="border: 1px solid #e1e4e6; padding: 10px; text-align: center;">3</td>
                    <td style="border: 1px solid #e1e4e6; padding: 10px; text-align: center;">4.5</td>
                    <td style="border: 1px solid #e1e4e6; padding: 10px; text-align: center; font-weight: 600;">D</td>
                    <td style="border: 1px solid #e1e4e6; padding: 10px; text-align: center; font-weight: 600;">Học cải thiện</td>
                </tr>
            </tbody>
        </table>
    `;

    // Chèn bảng điểm lên trước nội dung file text quy chế đổi điểm
    displayBox.parentNode.insertBefore(tableWrapper, displayBox);
}

function initGpaMiniBot() {
    const sendBtn = document.getElementById('miniSendBtn');
    const input = document.getElementById('miniInput');
    const messages = document.getElementById('miniMessages');

    if (!sendBtn || !input || !messages) return;

    const executeChat = () => {
        const promptText = input.value.trim();
        if (!promptText) return;

        // Hiển thị tin nhắn của sinh viên
        messages.innerHTML += `<div class="user-msg">${promptText}</div>`;
        input.value = '';
        
        const chatboxContainer = document.getElementById('miniChatbox');
        if (chatboxContainer) {
            chatboxContainer.scrollTop = chatboxContainer.scrollHeight;
        }

        // Trợ lý ảo mini phân tích học vụ dựa trên quy chế đổi điểm Văn Lang
        setTimeout(() => {
            let intelligentReply = `- Hệ thống đang đối chiếu thang điểm quy đổi học vụ...\n\nĐể kích hoạt câu trả lời AI thông minh, bạn tích hợp hàm API sinh văn bản kết hợp với file dữ liệu 'khungK30.txt' đang hiển thị ở panel bên cạnh nhé.`;
            messages.innerHTML += `<div class="bot-msg">${intelligentReply}</div>`;
            if (chatboxContainer) {
                chatboxContainer.scrollTop = chatboxContainer.scrollHeight;
            }
        }, 800);
    };

    sendBtn.onclick = executeChat;
    input.onkeydown = (e) => { if (e.key === 'Enter') executeChat(); };
}