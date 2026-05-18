/** * FILE: js/main.js
 * CHỨC NĂNG: Nhạc trưởng điều phối - FIX LỖI "ẤN KHÔNG ĂN" TRIỆT ĐỂ
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

        if (typeof window.updateHistorySidebar === "function") window.updateHistorySidebar();
    };

    // Chạy khởi tạo
    startApp();

    // --- PHẦN TỬ GIAO DIỆN ---
    const uiElements = {
        input: document.getElementById('userInput'),
        sendBtn: document.getElementById('sendBtn'),
        micBtn: document.querySelector('.mic-btn') // Fix: querySelector để tìm đúng class mic-btn
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
    const text = textWrapper.querySelector('.content').innerText;
    navigator.clipboard.writeText(text).then(() => {
        const originalIcon = el.className;
        el.className = "fas fa-check";
        setTimeout(() => el.className = originalIcon, 2000);
    });
};

window.speakText = (el) => {
    const textWrapper = el.closest('.message-wrapper') || el.closest('.bot-message');
    const text = textWrapper.querySelector('.content').innerText;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    window.speechSynthesis.speak(utterance);
};
document.addEventListener('DOMContentLoaded', () => {
    // Phải gọi theo thứ tự này
    if (window.ui) {
        window.ui.initDarkMode();
        window.ui.initSidebar();
        window.ui.updateDynamicGreeting();
        window.ui.initScrollToBottom();
        window.ui.renderHistory();
        window.ui.initClearHistory();
        window.ui.copyCode();
        window.vluAuthActions.loginWithGoogle();
        window.vluAuthActions.loginWithFacebook();
    }

    // Đảm bảo nút New Chat cũng chạy
    const newBtn = document.getElementById('newChatBtn');
    if (newBtn) {
        newBtn.onclick = () => location.reload();
    }
});