/** * FILE: js/ui.js
 * CHỨC NĂNG: Darkmode, Sidebar, Lịch sử chat (Đồng bộ Session chống trùng), Lời chúc và Hiệu ứng UI
 */

// Chỉ khai báo 1 lần duy nhất để tránh lỗi redeclaration
if (typeof get !== 'function') {
    window.get = (id) => document.getElementById(id);
}

// --- 1. HÀM VẼ LỊCH SỬ CHAT (SỬA LỖI CLICK THÙNG RÁC TRIỆT ĐỂ) ---
function renderHistory() {
    const list = document.getElementById('chatHistoryList');
    if (!list) return;

    // Đọc dữ liệu từ bộ lưu trữ vlu_chat_sessions chuẩn
    const allChats = JSON.parse(localStorage.getItem('vlu_chat_sessions')) || {};

    // Giữ lại tiêu đề "Gần đây"
    list.innerHTML = '<p class="history-label">Gần đây</p>';

    Object.keys(allChats).reverse().forEach(id => {
        const item = allChats[id];
        const div = document.createElement('div');
        div.className = 'history-item';
        if (id === window.currentChatId) div.classList.add('active');

        // Cấu trúc phân tách không gian rõ ràng bằng thuộc tính CSS nội dòng hỗ trợ an toàn
        div.innerHTML = `
            <div class="history-info" style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                <i class="far fa-comment-alt"></i> 
                <span class="history-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${item.title}</span>
            </div>
            <div class="history-actions" style="padding: 4px 8px; z-index: 10; cursor: pointer; display: flex; align-items: center;">
                <i class="fas fa-trash-alt delete-item-btn" title="Xóa cuộc trò chuyện này" style="opacity: 0.6; transition: opacity 0.2s;"></i>
            </div>
        `;

        // 🔹 SỬA LỖI CHỐNG TRÙNG SỰ KIỆN: Chỉ gán lệnh mở lại chat vào vùng chữ bên trái
        const infoPart = div.querySelector('.history-info');
        infoPart.onclick = (e) => {
            e.preventDefault();
            if (typeof window.loadSession === 'function') {
                window.loadSession(id);
            }
        };

        // 🔹 SỬA LỖI CHỐNG BUBBLING: Cô lập hoàn toàn cú click chuột của cụm thùng rác
        const actionsPart = div.querySelector('.history-actions');
        actionsPart.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation(); // 🔴 NGĂN CHẶN TUYỆT ĐỐI sự kiện bị nhảy ngược lên thẻ cha .history-item

            if (typeof window.deleteSpecificChat === 'function') {
                window.deleteSpecificChat(e, id);
            }
        };

        // Hiệu ứng hover đổi màu thùng rác mượt mà của riêng bạn
        const deleteBtn = div.querySelector('.delete-item-btn');
        actionsPart.onmouseover = () => { deleteBtn.style.opacity = "1";
            deleteBtn.style.color = "#d9534f"; };
        actionsPart.onmouseout = () => { deleteBtn.style.opacity = "0.6";
            deleteBtn.style.color = ""; };

        list.appendChild(div);
    });
}

// --- 2. HÀM XỬ LÝ CHUNG CHO CÁC NÚT ---
function handleAction(text, mode = 'default') {
    if (typeof window.setMode === 'function') window.setMode(mode);

    const welcome = get('welcomeScreen');
    if (welcome) welcome.classList.add('hidden'); // Sử dụng class hidden đồng bộ với index.html

    const container = get('messagesContainer');
    if (container) container.innerHTML = '';

    const input = get('userInput');
    if (input) {
        input.value = text;
        setTimeout(() => {
            if (typeof window.sendMessage === 'function') window.sendMessage();
        }, 50);
    }
}

// --- 3. QUẢN LÝ SIDEBAR (GIỮ NGUYÊN HOÀN TOÀN CƠ CHẾ OVERLAY MOBILE) ---
function initSidebar() {
    const sidebar = document.querySelector('aside');
    const toggle = get('toggleSidebar');

    // Tạo thêm lớp nền mờ (Overlay) cho Mobile nếu chưa có
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    if (toggle && sidebar) {
        toggle.onclick = (e) => {
            e.stopPropagation();
            // Chạy song song cả cơ chế co giãn trên Desktop lẫn cơ chế trượt active trên Mobile
            sidebar.classList.toggle('closed');
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        };
    }

    // Click vào vùng nền mờ thì tự đóng khép Sidebar lại trên điện thoại
    overlay.onclick = () => {
        if (sidebar) {
            sidebar.classList.remove('active');
            sidebar.classList.add('closed');
        }
        overlay.classList.remove('active');
    };

    const featureMap = {
        'btn-roadmap': { m: 'roadmap', t: 'Lộ trình học tập' },
        'btn-results': { m: 'results', t: 'Kết quả học tập' },
        'btn-graduation': { m: 'graduation', t: 'Dự báo tốt nghiệp' },
        'btn-future': { m: 'future', t: 'Định hướng tương lai' }
    };

    const sidebarElem = document.querySelector('.gemini-sidebar') || document.querySelector('aside');
    if (sidebarElem) {
        sidebarElem.onclick = function(e) {
            const btn = e.target.closest('button');
            if (btn && featureMap[btn.id]) {
                handleAction(featureMap[btn.id].t, featureMap[btn.id].m);
                // Đóng Sidebar luôn sau khi bấm chọn tính năng trên Mobile
                if (window.innerWidth <= 768) {
                    if (sidebar) {
                        sidebar.classList.remove('active');
                        sidebar.classList.add('closed');
                    }
                    overlay.classList.remove('active');
                }
            }
        };
    }

    // Tối ưu nút Tạo đoạn chat mới chạy đồng bộ không gây tải lại toàn bộ trang
    const newChatBtn = get('newChatBtn');
    if (newChatBtn) {
        newChatBtn.onclick = () => {
            window.currentChatId = null;
            if (typeof window.setCurrentChatId === 'function') window.setCurrentChatId(null);

            const container = get('messagesContainer');
            const welcome = get('welcomeScreen');
            if (container) container.innerHTML = '';
            if (welcome) welcome.classList.remove('hidden');

            const input = get('userInput');
            if (input) {
                input.value = '';
                input.style.height = 'auto';
                input.focus();
            }
            renderHistory();
        };
    }
}

// --- 4. NÚT SÁNG TỐI (DARK MODE) ---
function initDarkMode() {
    const btn = get('darkModeBtn');
    if (!btn) return;

    // Load theme cũ
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'fas fa-sun';
    }

    btn.onclick = () => {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
    };
}

// --- 5. LỜI CHÚC & SCROLL ---
function updateDynamicGreeting() {
    const g = get('dynamicGreeting');
    if (!g) return;
    const h = new Date().getHours();
    if (h < 12) g.innerText = "Chào buổi sáng! Chúc bạn ngày mới năng suất tại VLU! ☀️";
    else if (h < 18) g.innerText = "Buổi chiều tốt lành! Bạn đã nộp bài tập chưa đó? 📝";
    else g.innerText = "Tối muộn rồi, đừng thức khuya quá nhé sinh viên VLU ơi! 🌙";
}

function initScrollToBottom() {
    const box = get('chatbox');
    const btn = get('scrollToBottom');
    if (box && btn) {
        box.onscroll = () => {
            btn.style.display = (box.scrollTop < box.scrollHeight - box.clientHeight - 100) ? 'flex' : 'none';
        };
        btn.onclick = () => box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
    }
}

function initClearHistory() {
    const clearBtn = get('clearHistoryBtn');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if (confirm("Xóa hết lịch sử trò chuyện nhé?")) {
                localStorage.removeItem('vlu_chat_sessions');
                window.currentChatId = null;
                const container = get('messagesContainer');
                const welcome = get('welcomeScreen');
                if (container) container.innerHTML = '';
                if (welcome) welcome.classList.remove('hidden');
                renderHistory();
            }
        };
    }
}

function copyCode(btn) {
    if (!btn) return;
    const wrapper = btn.closest('.code-block-wrapper');
    if (!wrapper) return;
    const codeElement = wrapper.querySelector('code');
    if (!codeElement) return;

    const textToCopy = codeElement.innerText;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-check';
            btn.style.color = '#50fa7b';
        }

        showToast("Đã sao chép vào bộ nhớ tạm");

        setTimeout(() => {
            if (icon) {
                icon.className = 'far fa-clone';
                btn.style.color = '';
            }
        }, 2000);
    });
}

function showToast(message) {
    const oldToast = document.querySelector('.copy-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// --- XUẤT RA GLOBAL (GỘP TẤT CẢ) ---
window.ui = {
    initDarkMode,
    initSidebar,
    updateDynamicGreeting,
    initScrollToBottom,
    renderHistory,
    initClearHistory,
    copyCode,
    showToast,
    useSuggestion: handleAction,
    updateHistorySidebar: renderHistory // Định nghĩa alias kết nối hệ thống cho chat.js/main.js
};