const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

window.currentChatId = null;
window.vluKnowledgeContent = "";

function getApiKey() {
    return (typeof window.CONFIG !== "undefined" && window.CONFIG.GROQ_API_KEY) ? window.CONFIG.GROQ_API_KEY : "";
}

async function loadKnowledgeBase() {
    try {
        const response = await fetch('/knowledge/curriculum-IT.txt');
        if (response.ok) {
            window.vluKnowledgeContent = await response.text();
        }
    } catch (err) {
        console.error("Lỗi tải file tri thức:", err);
    }
}

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

    let imageData = null;
    if (hasImage && ui.preImg) {
        if (window.featureVision && typeof window.featureVision.compressImage === 'function') {
            imageData = await window.featureVision.compressImage(ui.preImg.src);
        } else {
            imageData = ui.preImg.src;
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

    const textLower = text.toLowerCase();
    const isVLUKeywords = textLower.includes('văn lang') ||
        textLower.includes('vlu') ||
        (textLower.includes('học phần') && textLower.includes('đăng ký')) ||
        (textLower.includes('tốt nghiệp') && textLower.includes('điều kiện')) ||
        (textLower.includes('lịch thi') || textLower.includes('phòng thi'));

    if (isVLUKeywords && !hasImage && !docContent && window.ui && typeof window.ui.fetchVLUData === 'function') {
        try {
            const botReply = await window.ui.fetchVLUData(text);
            removeTypingIndicator(typingMsg);
            renderBotMessage(botReply, true);
            saveChatToLocal('bot', botReply);
        } catch (err) {
            removeTypingIndicator(typingMsg);
            renderBotMessage("Ối! Hệ thống tra cứu dữ liệu trường gặp sự cố rồi.", true);
        }
        return;
    }

    const apiKey = getApiKey();

    if (!apiKey) {
        setTimeout(() => {
            removeTypingIndicator(typingMsg);
            renderBotMessage("Ối! Bạn chưa dán Key vào `config.js` kìa!", true);
        }, 600);
        return;
    }

    let contentPayload = [];
    let combinedText = text;

    const isCurriculumQuery = textLower.includes('ngành') ||
        textLower.includes('học phần') ||
        textLower.includes('môn') ||
        textLower.includes('đào tạo') ||
        textLower.includes('lộ trình') ||
        textLower.includes('khung') ||
        textLower.includes('chuyên ngành');

    if (isCurriculumQuery && window.vluKnowledgeContent) {
        combinedText = `Dữ liệu chương trình đào tạo chính thức của Khoa CNTT VLU:\n${window.vluKnowledgeContent}\n\nDựa vào dữ liệu trên, hãy trả lời câu hỏi sau của sinh viên:\n${text}`;
    } else if (docContent) {
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

    const systemPrompt = "Bạn là một AI Core siêu trí tuệ cao cấp, đóng vai trò là Trợ lý sinh viên toàn năng của Khoa CNTT - Đại học Văn Lang. Hãy trả lời thôngkinh, uyên bác, sử dụng từ ngữ tự nhiên, cuốn hút nhưng vẫn giữ vững quy chuẩn học thuật của một trợ lý cao cấp giống như ChatGPT và Gemini. Sử dụng định dạng cấu trúc Markdown giàu trực quan gồm tiêu đề (###), bôi đậm (**), khối trích dẫn (>), bảng biểu để phân tách thông tin đẹp đẽ, rõ ràng. Tuyệt đối trả lời dựa theo dữ liệu chính thức được cung cấp nếu có thông tin.";

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
                    { role: "system", content: systemPrompt },
                    { role: "user", content: contentPayload }
                ],
                max_tokens: 1024,
                temperature: 0.5
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

        let pins = JSON.parse(localStorage.getItem('vlu_pinned_chats')) || [];
        pins = pins.filter(p => p !== id);
        localStorage.setItem('vlu_pinned_chats', JSON.stringify(pins));

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

document.addEventListener('DOMContentLoaded', loadKnowledgeBase);