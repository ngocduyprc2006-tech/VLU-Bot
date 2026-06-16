//điều kiện xét tốt nghiệp
/**
 * FILE: js/features/graduation/graduation.js
 * CẬP NHẬT: Tự động nạp dữ liệu điều kiện từ file txt hệ thống,
 * dựng khung checklist tiêu chuẩn tốt nghiệp và cấu hình trợ lý mini panel phải.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("⚡ Module Graduation Check: Đang khởi chạy...");

    // 1. TỰ ĐỘNG NẠP FILE VĂN BẢN ĐIỀU KIỆN TỐT NGHIỆP LÊN PANEL TRÁI
    const graduationKnowledgeUrl = '/VLU-Chatbot/knowledge/khungK30.txt';

    fetch(graduationKnowledgeUrl)
        .then(res => {
            if (res.ok) return res.text();
            throw new Error("Không tìm thấy file quy chế tốt nghiệp.");
        })
        .then(textData => {
            const displayBox = document.getElementById('knowledgeContent');
            if (displayBox && textData) {
                // Xóa chữ "Đang tải..." và thay bằng dữ liệu file txt
                displayBox.innerText = textData;
            }
        })
        .catch(err => {
            console.error("Lưu ý: Chưa nạp được nội dung text quy chế bổ sung.");
        });

    // 2. DỰNG KHUNG DANH SÁCH CHECKLIST TIÊU CHUẨN (HIỂN THỊ PHÍA TRÊN FILE TEXT)
    initGraduationChecklist();

    // 3. KHỞI ĐỘNG CỔNG CHAT TRỢ LÝ XÉT TỐT NGHIỆP BÊN PANEL PHẢI
    initGraduationMiniBot();
});

function initGraduationChecklist() {
    const displayBox = document.getElementById('knowledgeContent');
    if (!displayBox) return;

    // Tạo một vùng danh sách trực quan chèn trước phần nội dung text thuần
    const checklistWrapper = document.createElement('div');
    checklistWrapper.className = 'checklist-wrapper';
    checklistWrapper.style.marginBottom = '20px';

    checklistWrapper.innerHTML = `
        <div class="check-item" style="display: flex; align-items: center; gap: 12px; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px; border: 1px solid #e2e8f0;">
            <i class="fas fa-check-circle" style="color: #28a745; font-size: 18px;"></i>
            <span>Tích lũy đủ số tín chỉ tối thiểu theo khung đào tạo CNTT (126 TC).</span>
        </div>
        <div class="check-item" style="display: flex; align-items: center; gap: 12px; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px; border: 1px solid #e2e8f0;">
            <i class="fas fa-times-circle" style="color: #dc3545; font-size: 18px;"></i>
            <span>Chứng chỉ Ngoại ngữ đầu ra (TOEIC 450 hoặc tương đương) - <strong style="color: #dc3545;">Chưa ghi nhận</strong></span>
        </div>
        <div class="check-item" style="display: flex; align-items: center; gap: 12px; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px; border: 1px solid #e2e8f0;">
            <i class="fas fa-check-circle" style="color: #28a745; font-size: 18px;"></i>
            <span>Chứng chỉ Tin học văn phòng MOS chuẩn đầu ra Đại học Văn Lang.</span>
        </div>
    `;

    // Chèn khung checklist lên trước nội dung file text
    displayBox.parentNode.insertBefore(checklistWrapper, displayBox);
}

function initGraduationMiniBot() {
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

        // Trợ lý ảo mini phản hồi dựa trên quy chế tốt nghiệp
        setTimeout(() => {
            let intelligentReply = `- Hệ thống đang đối chiếu điều kiện tốt nghiệp...\n\nĐể kích hoạt câu trả lời AI thông minh, bạn tích hợp hàm API sinh văn bản kết hợp với file dữ liệu 'khungK30.txt' đang hiển thị ở panel bên cạnh nhé.`;
            messages.innerHTML += `<div class="bot-msg">${intelligentReply}</div>`;
            if (chatboxContainer) {
                chatboxContainer.scrollTop = chatboxContainer.scrollHeight;
            }
        }, 800);
    };

    sendBtn.onclick = executeChat;
    input.onkeydown = (e) => { if (e.key === 'Enter') executeChat(); };
}