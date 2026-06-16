/**
 * FILE: js/features/career/career.js
 * CẬP NHẬT: Tự động nạp cẩm nang định hướng từ file txt hệ thống,
 * dựng sơ đồ Stack doanh nghiệp cần và cấu hình trợ lý mini bot panel phải.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("💼 Module Career: Đang khởi chạy...");

    // 1. TỰ ĐỘNG NẠP FILE VĂN BẢN ĐỊNH HƯỚNG NGHỀ NGHIỆP LÊN PANEL TRÁI
    const careerKnowledgeUrl = '/VLU-Chatbot/knowledge/curriculum-IT.txt';

    fetch(careerKnowledgeUrl)
        .then(res => {
            if (res.ok) return res.text();
            throw new Error("Không tìm thấy file cẩm nang nghề nghiệp.");
        })
        .then(textData => {
            const displayBox = document.getElementById('knowledgeContent');
            if (displayBox && textData) {
                // Xóa chữ "Đang tải..." và thay bằng dữ liệu file định hướng
                displayBox.innerText = textData;
            }
        })
        .catch(err => {
            console.error("Lưu ý: Chưa nạp được nội dung cẩm nang nghề nghiệp bổ sung.");
        });

    // 2. DỰNG SƠ ĐỒ STACK CÔNG NGHỆ TRỰC QUAN (HIỂN THỊ PHÍA TRÊN FILE TEXT)
    initCareerStack();

    // 3. KHỞI ĐỘNG CỔNG CHAT TRỢ LÝ ĐỊNH HƯỚNG BÊN PANEL PHẢI
    initCareerMiniBot();
});

function initCareerStack() {
    const displayBox = document.getElementById('knowledgeContent');
    if (!displayBox) return;

    // Tạo khối hiển thị các nhóm công nghệ tuyển dụng để chèn trước nội dung text thuần
    const stackWrapper = document.createElement('div');
    stackWrapper.className = 'career-stack-wrapper';
    stackWrapper.style.marginBottom = '20px';

    stackWrapper.innerHTML = `
        <div class="stack-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
            <div class="stack-card" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8f9fa;">
                <h4 style="margin: 0 0 8px 0; color: #e00000;"><i class="fas fa-layer-group"></i> Backend Stack</h4>
                <p style="margin: 4px 0; font-size: 13px; color: #555;">• Java (Spring Boot) / Node.js</p>
                <p style="margin: 4px 0; font-size: 13px; color: #555;">• CSDL: MySQL, SQL Server, MongoDB</p>
            </div>
            <div class="stack-card" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8f9fa;">
                <h4 style="margin: 0 0 8px 0; color: #e00000;"><i class="fas fa-laptop-code"></i> Frontend Stack</h4>
                <p style="margin: 4px 0; font-size: 13px; color: #555;">• HTML5, CSS3, JavaScript ES6</p>
                <p style="margin: 4px 0; font-size: 13px; color: #555;">• Framework: React.js / Vue.js</p>
            </div>
            <div class="stack-card" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8f9fa;">
                <h4 style="margin: 0 0 8px 0; color: #e00000;"><i class="fas fa-brain"></i> AI & Data Stack</h4>
                <p style="margin: 4px 0; font-size: 13px; color: #555;">• Ngôn ngữ: Python, R</p>
                <p style="margin: 4px 0; font-size: 13px; color: #555;">• Thư viện: Ngôn ngữ lớn (LLM), API Studio</p>
            </div>
        </div>
    `;

    // Chèn sơ đồ lên trước nội dung file text định hướng
    displayBox.parentNode.insertBefore(stackWrapper, displayBox);
}

function initCareerMiniBot() {
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

        // Trợ lý ảo mini phân tích định hướng thị trường
        setTimeout(() => {
            let intelligentReply = `- Hệ thống đang phân tích xu hướng Stack công nghệ tuyển dụng...\n\nĐể kích hoạt câu trả lời AI thông minh, bạn tích hợp hàm API sinh văn bản kết hợp với file dữ liệu 'curriculum-IT.txt' đang hiển thị ở panel bên cạnh nhé.`;
            messages.innerHTML += `<div class="bot-msg">${intelligentReply}</div>`;
            if (chatboxContainer) {
                chatboxContainer.scrollTop = chatboxContainer.scrollHeight;
            }
        }, 800);
    };

    sendBtn.onclick = executeChat;
    input.onkeydown = (e) => { if (e.key === 'Enter') executeChat(); };
}