/** * FILE: js/main.js
 * CHỨC NĂNG: Nhạc trưởng điều phối - FIX TRIỆT ĐỂ MẠCH ĐỒNG BỘ KHI XÓA PHIÊN CHAT & LOGO HOME
 */

// 1. Cấu hình Prompt chuyên gia
window.featurePrompts = {
    'roadmap': "Bạn là chuyên gia tư vấn lộ trình học tập tại VLU. Hãy dựa vào chương trình đào tạo để tư vấn môn học.",
    'results': "Bạn là chuyên gia phân tích kết quả học tập. Hãy giúp sinh viên hiểu về GPA và quy chế VLU.",
    'graduation': "Bạn là cố vấn tốt nghiệp. Tư vấn về điều kiện xét tốt nghiệp và chứng chỉ đầu ra.",
    'future': "Bạn là chuyên gia định hướng nghề nghiệp cho sinh viên VLU.",
    'default': "Bạn là trợ lý ảo của Đại học Văn Lang (VLU). Trả lời thân thiện bằng tiếng Việt."
};

window.currentSystemPrompt = window.featurePrompts['default'];

document.addEventListener('DOMContentLoaded', () => {
    console.log("%c🚀 VLU AI Core: Booting...", "color: #ff9900; font-weight: bold;");

    // --- HÀM KHỞI TẠO CÁC MODULE (FIX CHỐNG NULL) ---
    const startApp = () => {
        // Khởi tạo UI
        if (window.ui) {
            if (typeof ui.initDarkMode === 'function') ui.initDarkMode();
            if (typeof ui.initSidebar === 'function') ui.initSidebar();
            if (typeof ui.updateDynamicGreeting === 'function') ui.updateDynamicGreeting();
            if (typeof ui.initScrollToBottom === 'function') ui.initScrollToBottom();
            if (typeof ui.renderHistory === 'function') ui.renderHistory();
            if (typeof ui.initClearHistory === 'function') ui.initClearHistory();
        }

        // Khởi tạo Upload & Menu (+) - TRỌNG TÂM FIX TẠI ĐÂY
        if (window.upload) {
            if (typeof upload.initAttachMenu === 'function') upload.initAttachMenu();
            if (typeof upload.initFilePreview === 'function') upload.initFilePreview();
            if (typeof upload.initDragAndDrop === 'function') upload.initDragAndDrop();
            console.log("✅ Module Upload: Connected");
        } else {
            // Nếu chưa tìm thấy module upload, thử lại sau 500ms
            setTimeout(startApp, 500);
            return;
        }

        // FIX TRIỆT ĐỂ: Ưu tiên gọi hàm vẽ lại từ module window.ui để tránh lỗi không tìm thấy hàm
        if (window.ui && typeof window.ui.renderHistory === "function") {
            window.ui.renderHistory();
        } else if (typeof window.updateHistorySidebar === "function") {
            window.updateHistorySidebar();
        }
    };

    // Chạy khởi tạo
    startApp();

    // --- PHẦN TỬ GIAO DIỆN ---
    const uiElements = {
        input: document.getElementById('userInput'),
        sendBtn: document.getElementById('sendBtn'),
        micBtn: document.querySelector('.mic-btn'),
        logoHomeBtn: document.getElementById('logoHomeBtn'), // Thêm element logo trang chủ mới
        helpBtn: document.getElementById('helpBtn') // Thêm element nút trợ giúp mới
    };

    // --- HÀM GỬI TIN NHẮN ---
    const handleSend = () => {
        const sendFunc = window.sendMessage || (window.chat && window.chat.sendMessage);
        if (typeof sendFunc === 'function') {
            sendFunc();
        } else {
            console.error("❌ sendMessage() not found in chat.js");
        }
    };

    // --- CẢI TIẾN 1: LOGIC TÍCH HỢP NÚT TRANG CHỦ VÀO LOGO ---
    if (uiElements.logoHomeBtn) {
        uiElements.logoHomeBtn.onclick = (e) => {
            e.preventDefault();

            // Khôi phục trạng thái ban đầu
            window.currentChatId = null;
            window.currentSystemPrompt = window.featurePrompts['default'];

            // Xóa toàn bộ tin nhắn đang hiển thị trên khung chat
            const messagesContainer = document.getElementById('messagesContainer');
            if (messagesContainer) messagesContainer.innerHTML = '';

            // Mở lại màn hình chào mừng (Welcome Screen)
            const welcomeScreen = document.getElementById('welcomeScreen');
            if (welcomeScreen) welcomeScreen.classList.remove('hidden');

            // Reset thanh nhập liệu về rỗng
            if (uiElements.input) {
                uiElements.input.value = '';
                uiElements.input.style.height = 'auto';
                uiElements.input.focus();
            }

            // Vẽ lại lịch sử sidebar để bỏ chọn trạng thái active của hàng cũ
            if (window.ui && typeof window.ui.renderHistory === 'function') {
                window.ui.renderHistory();
            }
        };
    }

    // --- CẢI TIẾN 2: LOGIC KÍCH HOẠT NÚT TRỢ GIÚP ĐÁY SIDEBAR ---
    if (uiElements.helpBtn) {
        uiElements.helpBtn.onclick = (e) => {
            e.preventDefault();
            alert("💡 HƯỚNG DẪN SỬ DỤNG VLU CHATBOT:\n\n" +
                "1. Bấm trực tiếp vào LOGO trường Văn Lang để làm mới cuộc hội thoại và quay về trang chủ ban đầu.\n" +
                "2. Chọn các tính năng (Lộ trình cá nhân, Kết quả học tập...) để kích hoạt trợ lý chuyên gia chuyên sâu.\n" +
                "3. Bạn có thể xóa riêng lẻ từng phiên chat cũ bằng cách bấm vào biểu tượng Thùng rác nhỏ ngay cạnh dòng lịch sử.");
        };
    }

    // --- TÍNH NĂNG 1: GIỌNG NÓI (VOICE) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (uiElements.micBtn && SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';

        uiElements.micBtn.onclick = (e) => {
            e.preventDefault();
            recognition.start();
            uiElements.micBtn.classList.add('recording');
            uiElements.micBtn.style.color = "red";
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (uiElements.input) {
                uiElements.input.value = transcript;
                handleSend(); // Nói xong tự gửi luôn
            }
            uiElements.micBtn.classList.remove('recording');
            uiElements.micBtn.style.color = "";
        };

        recognition.onerror = () => {
            uiElements.micBtn.classList.remove('recording');
            uiElements.micBtn.style.color = "";
        };
    }

    // --- TÍNH NĂNG 2: BÀN PHÍM & AUTO-RESIZE ---
    if (uiElements.input) {
        uiElements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });

        uiElements.input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 180) + 'px';
        });
        uiElements.input.focus();
    }

    if (uiElements.sendBtn) {
        uiElements.sendBtn.onclick = (e) => {
            e.preventDefault();
            handleSend();
        };
    }

    console.log("%c🏁 VLU AI Core: Ready to chat!", "color: #00ff00; font-weight: bold;");
});

// --- HELPERS (Global) ---
window.copyText = (el) => {
    const textWrapper = el.closest('.message-wrapper') || el.closest('.bot-message');
    if (!textWrapper) return;
    const text = textWrapper.querySelector('.content').innerText;
    navigator.clipboard.writeText(text).then(() => {
        const originalIcon = el.className;
        el.className = "fas fa-check";
        setTimeout(() => el.className = originalIcon, 2000);
    });
};

window.speakText = (el) => {
    const textWrapper = el.closest('.message-wrapper') || el.closest('.bot-message');
    if (!textWrapper) return;
    const text = textWrapper.querySelector('.content').innerText;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    window.speechSynthesis.speak(utterance);
};

// --- KHỐI SỰ KIỆN PHỤ TRỢ (KHÔNG LÀM ẢNH HƯỞNG ĐẾN CƠ CHẾ KHỞI CHẠY GỐC) ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.ui) {
        if (typeof window.ui.initDarkMode === 'function') window.ui.initDarkMode();
        if (typeof window.ui.initSidebar === 'function') window.ui.initSidebar();
        if (typeof window.ui.updateDynamicGreeting === 'function') window.ui.updateDynamicGreeting();
        if (typeof window.ui.initScrollToBottom === 'function') window.ui.initScrollToBottom();
        if (typeof window.ui.renderHistory === 'function') window.ui.renderHistory();
        if (typeof window.ui.initClearHistory === 'function') window.ui.initClearHistory();
        if (typeof window.ui.copyCode === 'function') window.ui.copyCode();
    }

    if (window.vluAuthActions) {
        if (typeof window.vluAuthActions.loginWithGoogle === 'function') window.vluAuthActions.loginWithGoogle();
        if (typeof window.vluAuthActions.loginWithFacebook === 'function') window.vluAuthActions.loginWithFacebook();
    }

    // Gán nút tạo đoạn chat mới dọn sạch khung chat trực tiếp thay vì reload nặng trang
    const newBtn = document.getElementById('newChatBtn');
    if (newBtn) {
        newBtn.onclick = () => {
            window.currentChatId = null;
            window.currentSystemPrompt = window.featurePrompts['default'];
            const container = document.getElementById('messagesContainer');
            const welcome = document.getElementById('welcomeScreen');
            if (container) container.innerHTML = '';
            if (welcome) welcome.classList.remove('hidden');
            const input = document.getElementById('userInput');
            if (input) {
                input.value = '';
                input.style.height = 'auto';
                input.focus();
            }
            if (window.ui && typeof window.ui.renderHistory === 'function') window.ui.renderHistory();
        };
    }
});