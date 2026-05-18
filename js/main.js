/** * FILE: js/main.js
 * CHỨC NĂNG: Nhạc trưởng điều phối - KHỚP NỐI TOÀN BỘ CÁC MODULE CON SAU KHI TÁCH FILE
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

    // --- HÀM KHỞI TẠO CÁC MODULE (FIX CHỐNG NULL VÀ LIÊN KẾT MODULE MỚI) ---
    const startApp = () => {
        // Khởi tạo Lõi UI Giao diện
        if (window.ui) {
            if (typeof ui.initSidebar === 'function') ui.initSidebar();
            if (typeof ui.updateDynamicGreeting === 'function') ui.updateDynamicGreeting();
            if (typeof ui.initScrollToBottom === 'function') ui.initScrollToBottom();
            if (typeof ui.renderHistory === 'function') ui.renderHistory();
            if (typeof ui.initClearHistory === 'function') ui.initClearHistory();
        }

        // Khởi tạo Lõi Auth Xác thực mới xé lẻ
        if (window.vluAuthState && typeof window.vluAuthState.init === 'function') window.vluAuthState.init();
        if (window.vluAuthUtils && typeof window.vluAuthUtils.init === 'function') window.vluAuthUtils.init();
        if (window.vluRegister && typeof window.vluRegister.init === 'function') window.vluRegister.init();
        if (window.vluLogin) {
            if (typeof window.vluLogin.initTabs === 'function') window.vluLogin.initTabs();
            if (typeof window.vluLogin.initLoginFormSubmit === 'function') window.vluLogin.initLoginFormSubmit();
        }

        // Khởi tạo Lõi Kéo thả file Upload
        if (window.upload) {
            if (typeof upload.initFilePreview === 'function') upload.initFilePreview();
            if (typeof upload.initDragAndDrop === 'function') upload.initDragAndDrop();
            console.log("✅ Module Upload & Drag-Drop: Connected");
        } else {
            // Nếu chưa tìm thấy module upload, thử lại sau 300ms
            setTimeout(startApp, 300);
            return;
        }

        // Khởi tạo các module tính năng mở rộng trong thư mục features/
        if (window.featureMenu && typeof window.featureMenu.init === 'function') window.featureMenu.init();
        if (window.featureTheme && typeof window.featureTheme.init === 'function') window.featureTheme.init();
        if (window.featureHelp && typeof window.featureHelp.init === 'function') window.featureHelp.init();
        if (window.featureSetting && typeof window.featureSetting.init === 'function') window.featureSetting.init();

        // Đồng bộ vẽ lại lịch sử sidebar khi khởi động trang
        if (window.ui && typeof window.ui.renderHistory === "function") {
            window.ui.renderHistory();
        }
    };

    // Chạy khởi tạo hệ thống tổng hợp
    startApp();

    // --- PHẦN TỬ GIAO DIỆN ---
    const uiElements = {
        input: document.getElementById('userInput'),
        sendBtn: document.getElementById('sendBtn'),
        micBtn: document.querySelector('.mic-btn'),
        logoHomeBtn: document.getElementById('logoHomeBtn'),
        helpBtn: document.getElementById('helpBtn')
    };

    // --- HÀM GỬI TIN NHẮN TỚI CHAT.JS ---
    const handleSend = () => {
        const sendFunc = window.sendMessage || (window.chat && window.chat.sendMessage);
        if (typeof sendFunc === 'function') {
            sendFunc();
        } else {
            console.error("❌ sendMessage() not found in chat.js");
        }
    };

    // --- LOGIC TÍCH HỢP NÚT TRANG CHỦ VÀO LOGO VLU ---
    if (uiElements.logoHomeBtn) {
        uiElements.logoHomeBtn.onclick = (e) => {
            e.preventDefault();

            window.currentChatId = null;
            window.currentSystemPrompt = window.featurePrompts['default'];

            const messagesContainer = document.getElementById('messagesContainer');
            if (messagesContainer) messagesContainer.innerHTML = '';

            const welcomeScreen = document.getElementById('welcomeScreen');
            if (welcomeScreen) welcomeScreen.classList.remove('hidden');

            if (uiElements.input) {
                uiElements.input.value = '';
                uiElements.input.style.height = 'auto';
                uiElements.input.focus();
            }

            if (window.ui && typeof window.ui.renderHistory === 'function') {
                window.ui.renderHistory();
            }
        };
    }

    // --- TÍNH NĂNG: GHI ÂM GIỌNG NÓI TIẾNG VIỆT ---
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
                handleSend();
            }
            uiElements.micBtn.classList.remove('recording');
            uiElements.micBtn.style.color = "";
        };

        recognition.onerror = () => {
            uiElements.micBtn.classList.remove('recording');
            uiElements.micBtn.style.color = "";
        };
    }

    // --- TÍNH NĂNG: BÀN PHÍM ENTER & TỰ ĐỘNG CO GIÃN TEXTAREA ---
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

// --- HELPERS TIỆN ÍCH TOÀN CỤC (GLOBAL) ---
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