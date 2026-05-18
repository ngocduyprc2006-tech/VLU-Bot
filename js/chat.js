/** * FILE: js/chat.js
 * FIX TRIỆT ĐỂ: Xử lý Vision (Ảnh + Chữ) & Nén ảnh tự động & Lưu lịch sử
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function getApiKey() {
    return (typeof window.CONFIG !== "undefined" && window.CONFIG.GROQ_API_KEY) ? window.CONFIG.GROQ_API_KEY : "";
}

// --- HÀM NÉN ẢNH (BÍ KÍP ĐỂ KHÔNG LỖI KẾT NỐI) ---
async function compressImage(base64Str, maxWidth = 800) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
    });
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

    // --- 1. XỬ LÝ HIỂN THỊ TIN NHẮN NGƯỜI DÙNG ---
    let imageData = null;
    if (hasImage && ui.preImg) {
        imageData = await compressImage(ui.preImg.src);
        renderUserImageMessage(imageData);
        ui.preContainer.style.display = 'none';
    }

    if (text || docContent) {
        const displayPrompt = text + (docContent ? `\n*(Đã đính kèm tài liệu)*` : "");
        renderUserMessage(displayPrompt);
    }

    ui.input.value = '';
    ui.input.style.height = 'auto';

    const typingMsg = showTypingIndicator();
    const apiKey = getApiKey();

    if (!apiKey) {
        setTimeout(() => {
            removeTypingIndicator(typingMsg);
            renderBotMessage("Ối! Duy chưa dán Key vào `config.js` kìa!", true);
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
                model: "llama-3.1-8b-instant", // Model ổn định để tránh lỗi decommissioned
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
            window.lastUploadedDocContent = "";

            // --- KÍCH HOẠT LƯU LỊCH SỬ TẠI ĐÂY ---
            if (text) {
                saveChatHistory(text);
            } else if (hasImage) {
                saveChatHistory("Đã gửi một hình ảnh");
            }
        } else if (data.error) {
            renderBotMessage("Ối! Groq báo lỗi: " + data.error.message);
        }
    } catch (error) {
        removeTypingIndicator(typingMsg);
        renderBotMessage("Ối! Mạng chập chờn rồi Duy ơi.", true);
        console.error("Lỗi:", error);
    }
}

// --- CÁC HÀM PHỤ TRỢ ---
function renderUserMessage(text) {
    const container = document.getElementById('messagesContainer');
    const msgDiv = document.createElement('div');
    msgDiv.className = "message user-message fade-in"; // Phải có cả 2 class
    msgDiv.innerHTML = `<div class="content">${text}</div>`;
    container.appendChild(msgDiv);
    scrollToBottom();
}

function renderUserImageMessage(url) {
    const c = document.getElementById('messagesContainer');
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
    const msgDiv = document.createElement('div');
    msgDiv.className = "message bot-message fade-in";

    // Sử dụng Marked để chuyển Markdown sang HTML
    let htmlContent = (typeof marked !== 'undefined') ? marked.parse(text) : text;

    // TẠO HEADER CHO KHỐI CODE
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Tìm tất cả các thẻ <pre> (nơi chứa code) để chèn Header
    tempDiv.querySelectorAll('pre').forEach(pre => {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';

        // Lấy tên ngôn ngữ (ví dụ: java, javascript)
        const codeElement = pre.querySelector('code');
        let lang = 'Code';
        if (codeElement) {
            const langClass = Array.from(codeElement.classList).find(c => c.startsWith('language-'));
            if (langClass) lang = langClass.replace('language-', '').toUpperCase();
        }

        // Tạo thanh Header
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

function showTypingIndicator() {
    const c = document.getElementById('messagesContainer');
    const d = document.createElement('div');
    d.className = "message bot-message typing-indicator";
    d.innerHTML = `<div class="bot-icon"><i class="fas fa-robot"></i></div><div class="content"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    c.appendChild(d);
    scrollToBottom();
    return d;
}

function removeTypingIndicator(e) { if (e && e.parentNode) e.parentNode.removeChild(e); }

function scrollToBottom() { const b = document.getElementById('chatbox'); if (b) b.scrollTop = b.scrollHeight; }

window.sendMessage = sendMessage;

// --- HÀM LƯU LỊCH SỬ ---
function saveChatHistory(firstQuestion) {
    let history = JSON.parse(localStorage.getItem('vlu_chat_history') || '[]');

    // Kiểm tra trùng
    if (!history.find(item => item.title === firstQuestion)) {
        // Dùng UNSHIFT để đẩy phần tử mới vào ĐẦU mảng
        history.unshift({
            id: Date.now(),
            title: firstQuestion.substring(0, 30) + (firstQuestion.length > 30 ? '...' : ''),
            date: new Date().toLocaleDateString()
        });

        if (history.length > 10) history.pop(); // Xóa cái cũ nhất ở cuối

        localStorage.setItem('vlu_chat_history', JSON.stringify(history));

        if (window.ui && window.ui.renderHistory) {
            window.ui.renderHistory();
        }
    }
}