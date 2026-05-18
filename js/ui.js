/** * FILE: js/ui.js
 * CHỨC NĂNG: Darkmode, Sidebar, Lịch sử chat và Lời chúc
 */

// Chỉ khai báo 1 lần duy nhất để tránh lỗi redeclaration
if (typeof get !== 'function') {
    window.get = (id) => document.getElementById(id);
}

// --- 1. HÀM VẼ LỊCH SỬ CHAT ---
function renderHistory() {
    const list = get('chatHistoryList');
    if (!list) return;

    const history = JSON.parse(localStorage.getItem('vlu_chat_history') || '[]');

    // Giữ lại tiêu đề "Gần đây"
    list.innerHTML = '<p class="history-label">Gần đây</p>';

    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<i class="far fa-comment-alt"></i> <span>${item.title}</span>`;

        // Click để chat lại câu đo`
        div.onclick = () => {
            handleAction(item.title, 'default');
        };
        list.appendChild(div);
    });
}

// --- 2. HÀM XỬ LÝ CHUNG CHO CÁC NÚT ---
function handleAction(text, mode = 'default') {
    if (typeof window.setMode === 'function') window.setMode(mode);

    const welcome = get('welcomeScreen');
    if (welcome) welcome.style.display = 'none';

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

// --- 3. QUẢN LÝ SIDEBAR ---
function initSidebar() {
    const sidebar = document.querySelector('aside');
    const toggle = get('toggleSidebar');
    if (toggle && sidebar) {
        toggle.onclick = () => sidebar.classList.toggle('closed');
    }

    const featureMap = {
        'btn-roadmap': { m: 'roadmap', t: 'Lộ trình học tập' },
        'btn-results': { m: 'results', t: 'Kết quả học tập' },
        'btn-graduation': { m: 'graduation', t: 'Dự báo tốt nghiệp' },
        'btn-future': { m: 'future', t: 'Định hướng tương lai' }
    };

    const sidebarElem = document.querySelector('.gemini-sidebar');
    if (sidebarElem) {
        sidebarElem.onclick = function(e) {
            const btn = e.target.closest('button');
            if (btn && featureMap[btn.id]) {
                handleAction(featureMap[btn.id].t, featureMap[btn.id].m);
            }
        };
    }

    const newChatBtn = get('newChatBtn');
    if (newChatBtn) {
        newChatBtn.onclick = () => location.reload();
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
            // Hỏi lại cho chắc, không lỡ tay bấm nhầm thì phí
            if (confirm("Xóa hết lịch sử trò chuyện nhé?")) {
                localStorage.removeItem('vlu_chat_history');
                // Gọi hàm vẽ lại để danh sách trắng tinh ngay lập tức
                if (typeof renderHistory === 'function') {
                    renderHistory();
                }
            }
        };
    }
}

function copyCode(btn) {
    const wrapper = btn.closest('.code-block-wrapper');
    const codeElement = wrapper.querySelector('code');
    if (!codeElement) return;

    const textToCopy = codeElement.innerText;

    navigator.clipboard.writeText(textToCopy).then(() => {
        // 1. Hiệu ứng icon trên nút bấm
        const icon = btn.querySelector('i');
        icon.className = 'fas fa-check';
        btn.style.color = '#50fa7b';

        // 2. TẠO THÔNG BÁO "ĐÃ SAO CHÉP" GIỐNG GPT
        showToast("Đã sao chép vào bộ nhớ tạm");

        setTimeout(() => {
            icon.className = 'far fa-clone';
            btn.style.color = '';
        }, 2000);
    });
}

// Hàm bổ trợ hiện thông báo bay
function showToast(message) {
    // Xóa toast cũ nếu còn
    const oldToast = document.querySelector('.copy-toast');
    if (oldToast) oldToast.remove();

    // Tạo toast mới
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);

    // Kích hoạt hiệu ứng bay lên
    setTimeout(() => toast.classList.add('show'), 10);

    // Tự động biến mất sau 2.5 giây
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
    useSuggestion: handleAction
};