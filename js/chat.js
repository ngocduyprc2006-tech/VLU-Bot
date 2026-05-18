/** * FILE: js/chat.js
 * CHỨC NĂNG: Xử lý đóng gói payload Chat, gửi nhận API Groq & Quản lý vòng đời Session
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

window.currentChatId = null;

function getApiKey() {
    return (typeof window.CONFIG !== "undefined" && window.CONFIG.GROQ_API_KEY) ? window.CONFIG.GROQ_API_KEY : "";
}

// --- HÀM GỬI TIN NHẮN CHÍNH ---
async function sendMessage() {
    const ui = {
        input: document.getElementById('userInput'),
        display: document.getElementById('messagesContainer'),
        box: document.getElementById('chatbox'),
        welcome: document.getElementById('welcomeScreen'),
        preContainer: document.getElementById('imagePreviewContainer'),
        preImg: document.getElementById('imagePreview')
    };

    if (!ui.input || !ui.display) return;

    const text = ui.input.value.trim();
    const hasImage = ui.preContainer && ui.preContainer.style.display === 'block';
    const docContent = window.lastUploadedDocContent || "";

    if (!text && !hasImage && !docContent) return;

    if (ui.welcome) ui.welcome.classList.add('hidden');

    // --- 1. XỬ LÝ HIỂN THỊ TIN NHẮN NGƯỜI DÙNG ---
    let imageData = null;
    if (hasImage && ui.preImg) {
        // Gọi hàm nén ảnh từ module vision độc lập vừa bóc tách
        if (window.featureVision && typeof window.featureVision.compressImage === 'function') {
            imageData = await window.featureVision.compressImage(ui.preImg.src);
        } else {
            imageData = ui.preImg.src; // Fallback nếu chưa load kịp file
        }
        renderUserImageMessage(imageData);
        saveChatToLocal('user', text ? `[Hình ảnh] ${text}` : "[Hình ảnh]");
        ui.preContainer.style.display = 'none';
    } else if (text || docContent) {
        const displayPrompt = text + (docContent ? `\n*(Đã đính kèm tài liệu)*` : "");
        renderUserMessage(displayPrompt);
        saveChatToLocal('user', displayPrompt);
    }

    ui.input.value = '';
    ui.input.style.height = 'auto';

    const typingMsg = showTypingIndicator();
    const apiKey = getApiKey();

    if (!apiKey) {
        setTimeout(() => {
            removeTypingIndicator(typingMsg);
            renderBotMessage("Ối! Bạn chưa dán Key vào `config.js` kìa!", true);
        }, 600);
        return;
    }

    // --- 2. CẤU TRÚC PAYLOAD ĐA PHƯƠNG THỨC ---
    let contentPayload = [];
    let combinedText = text;
    if (docContent) {
        combinedText = `Nội dung tài liệu: ${docContent}\n\nCâu hỏi: ${text}`;
    }

    if (combinedText) {
        contentPayload.push({ type: "text", text: combinedText });
    }

    if (hasImage && imageData) {
        contentPayload.push({
            type: "image_url",
            image_url: { url: imageData }
        });
        ui.preImg.src = '';
    }

    // --- 3. GỌI API ---
    try {
        const response = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: window.currentSystemPrompt || "Trợ lý VLU" },
                    { role: "user", content: contentPayload }
                ],
                max_tokens: 1024,
                temperature: 0.7
            })
        });

        const data = await response.json();
        removeTypingIndicator(typingMsg);

        if (data.choices && data.choices[0]) {
            const botResponse = data.choices[0].message.content;
            renderBotMessage(botResponse, true);
            saveChatToLocal('bot', botResponse);
            window.lastUploadedDocContent = "";
        } else if (data.error) {
            renderBotMessage("Ối! Groq báo lỗi: " + data.error.message);
        }
    } catch (error) {
        removeTypingIndicator(typingMsg);
        renderBotMessage("Ối! Mạng chập chờn rồi bạn ơi.", true);
        console.error("Lỗi:", error);
    }
}

// --- CÁC HÀM PHỤ TRỢ HIỂN THỊ THỦ CÔNG ---
function renderUserMessage(text) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = "message user-message fade-in";
    msgDiv.innerHTML = `<div class="content">${text}</div>`;
    container.appendChild(msgDiv);
    scrollToBottom();
}

function renderUserImageMessage(url) {
    const c = document.getElementById('messagesContainer');
    if (!c) return;
    const d = document.createElement('div');
    d.className = "message user-message fade-in";
    d.innerHTML = `
        <div class="content" style="background:none; padding:0;">
            <img src="${url}" style="max-width:200px; border-radius:12px; border:2px solid #fff; box-shadow:0 4px 10px rgba(0,0,0,0.2);">
        </div>`;
    c.appendChild(d);
    scrollToBottom();
}

function renderBotMessage(text) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = "message bot-message fade-in";

    let htmlContent = (typeof marked !== 'undefined') ? marked.parse(text) : text;

    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    tempDiv.querySelectorAll('pre').forEach(pre => {
        let wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';

        const codeElement = pre.querySelector('code');
        let lang = 'Code';
        if (codeElement) {
            const langClass = Array.from(codeElement.classList).find(c => c.startsWith('language-'));
            if (langClass) lang = langClass.replace('language-', '').toUpperCase();
        }

        const header = document.createElement('div');
        header.className = 'code-header';
        header.innerHTML = `
            <span class="code-lang"><i class="fas fa-code"></i> ${lang}</span>
            <button class="copy-btn" onclick="window.ui.copyCode(this)" title="Sao chép mã nguồn">
                <i class="far fa-clone"></i>
            </button>
        `;

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
    });

    msgDiv.innerHTML = `
        <div class="bot-icon"><i class="fas fa-robot"></i></div>
        <div class="content">${tempDiv.innerHTML}</div>
    `;

    container.appendChild(msgDiv);
    if (window.Prism) window.Prism.highlightAllUnder(msgDiv);
    scrollToBottom();
}

// Xuất các hàm kết xuất ra global cho các file chuyên môn khác dùng chung
window.renderBotMessage = renderBotMessage;
window.renderUserMessage = renderUserMessage;

function showTypingIndicator() {
    const c = document.getElementById('messagesContainer');
    if (!c) return null;
    const d = document.createElement('div');
    d.className = "message bot-message typing-indicator";
    d.innerHTML = `<div class="bot-icon"><i class="fas fa-robot"></i></div><div class="content"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    c.appendChild(d);
    scrollToBottom();
    return d;
}

function removeTypingIndicator(e) { if (e && e.parentNode) e.parentNode.removeChild(e); }

function scrollToBottom() { const b = document.getElementById('chatbox'); if (b) b.scrollTop = b.scrollHeight; }

// --- HÀM LƯU LỊCH SỬ CHAT THEO HỆ THỐNG PHIÊN (SESSION-BASED) ---
function saveChatToLocal(role, text) {
    if (!window.currentChatId) {
        window.currentChatId = Date.now().toString();
    }
    let allChats = JSON.parse(localStorage.getItem('vlu_chat_sessions')) || {};
    if (!allChats[window.currentChatId]) {
        let titleText = text.replace(/\[Hình ảnh\]\s*/g, "");
        allChats[window.currentChatId] = {
            title: titleText.substring(0, 25) + (titleText.length > 25 ? '...' : ''),
            messages: [],
            timestamp: Date.now()
        };
    }
    allChats[window.currentChatId].messages.push({ role, text });
    localStorage.setItem('vlu_chat_sessions', JSON.stringify(allChats));

    if (window.ui && typeof window.ui.renderHistory === 'function') {
        window.ui.renderHistory();
    }
}

function renderSession(id) {
    const container = document.getElementById('messagesContainer');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const allChats = JSON.parse(localStorage.getItem('vlu_chat_sessions')) || {};
    const chatData = allChats[id];

    if (chatData && container) {
        container.innerHTML = '';
        if (welcomeScreen) welcomeScreen.classList.add('hidden');

        chatData.messages.forEach(msg => {
            if (msg.role === 'user') {
                renderUserMessage(msg.text);
            } else {
                renderBotMessage(msg.text, false);
            }
        });
        scrollToBottom();
    }
}

window.sendMessage = sendMessage;

window.loadSession = function(id) {
    window.currentChatId = id;
    renderSession(id);
    if (window.ui && typeof window.ui.renderHistory === 'function') window.ui.renderHistory();
};

window.deleteSpecificChat = function(event, id) {
    if (event) event.stopPropagation();

    if (confirm('Bạn có muốn xóa cuộc trò chuyện này không?')) {
        let allChats = JSON.parse(localStorage.getItem('vlu_chat_sessions')) || {};
        delete allChats[id];
        localStorage.setItem('vlu_chat_sessions', JSON.stringify(allChats));

        if (id === window.currentChatId) {
            window.currentChatId = null;
            const container = document.getElementById('messagesContainer');
            const welcomeScreen = document.getElementById('welcomeScreen');
            if (container) container.innerHTML = '';
            if (welcomeScreen) welcomeScreen.classList.remove('hidden');
        }

        if (window.ui && typeof window.ui.renderHistory === 'function') {
            window.ui.renderHistory();
        }
    }
};