const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

window.currentChatId = null;
window.vluAllKnowledgeContent = "";

function getApiKey() {
    return (typeof window.CONFIG !== "undefined" && window.CONFIG.GROQ_API_KEY) ? window.CONFIG.GROQ_API_KEY : "";
}

async function loadKnowledgeBase() {
    try {
        const listResponse = await fetch('/knowledge/list.json');
        if (!listResponse.ok) return;


        const fileList = await listResponse.json();
        let combinedData = "";


        for (const fileName of fileList) {
            try {
                const fileResponse = await fetch(`/knowledge/${fileName}`);
                if (fileResponse.ok) {
                    const fileText = await fileResponse.text();
                    combinedData += `--- NỘI DUNG TỆP TRI THỨC CHÍNH THỨC: ${fileName} ---\n${fileText}\n\n`;
                }
            } catch (fileErr) { console.error(`Không thể nạp tệp ${fileName}:`, fileErr); }
        }


        window.vluAllKnowledgeContent = combinedData;
    } catch (err) { console.error("Lỗi đồng bộ danh mục tri thức hệ thống:", err); }
}

async function sendMessage() {
    const ui = {
        input: document.getElementById('userInput'),
        display: document.getElementById('messagesContainer'),
        box: document.getElementById('chatbox'),
        welcome: document.getElementById('welcomeScreen'),
        preContainer: document.getElementById('imagePreviewContainer')
    };

    if (!ui.input || !ui.display) return;

    const text = ui.input.value.trim();
    const docContent = window.lastUploadedDocContent || "";
    const previewImages = ui.preContainer ? Array.from(ui.preContainer.querySelectorAll('img')) : [];
    const hasImage = previewImages.length > 0;

    if (!text && !hasImage && !docContent) return;

    if (ui.welcome) ui.welcome.classList.add('hidden');

    // Lấy và nén ảnh trước khi xóa preview. Đây là dữ liệu sẽ gửi lên model vision.
    const imagePayloads = [];
    if (hasImage) {
        for (const img of previewImages) {
            const src = img.src;
            let dataToSend = src;
            if (window.featureVision && typeof window.featureVision.compressImage === 'function') {
                dataToSend = await window.featureVision.compressImage(src);
            }
            imagePayloads.push(dataToSend);
        }
    }

    const imageDefaultPrompt = "Hãy đọc nội dung trong ảnh và trả lời rõ ràng bằng tiếng Việt. Nếu ảnh là câu hỏi trắc nghiệm, hãy chọn đáp án đúng và giải thích ngắn gọn.";
    const userQuestion = text || (hasImage ? imageDefaultPrompt : "");

    // Hiển thị tin nhắn người dùng
    if (hasImage) {
        imagePayloads.forEach(url => renderUserImageMessage(url));
        if (text) renderUserMessage(text);
        saveChatToLocal('user', text ? `[Hình ảnh] ${text}` : "[Hình ảnh] Đọc ảnh và trả lời");

        const previewList = ui.preContainer.querySelector('#previewList');
        if (previewList) previewList.innerHTML = '';
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
            renderBotMessage("Ối! Bạn chưa dán Key vào config.js kìa!", true);
        }, 600);
        return;
    }

    // --- KIỂM TRA TỪ KHÓA BẰNG HÀM CÓ SẴN (NẾU CÓ) ---
    const textLower = userQuestion.toLowerCase();
    const isVLUKeywords = textLower.includes('văn lang') || textLower.includes('vlu') || (textLower.includes('học phần') && textLower.includes('đăng ký')) || (textLower.includes('tốt nghiệp') && textLower.includes('điều kiện')) || (textLower.includes('lịch thi') || textLower.includes('phòng thi'));

    if (isVLUKeywords && !hasImage && !docContent && window.ui && typeof window.ui.fetchVLUData === 'function') {
        try {
            const botReply = await window.ui.fetchVLUData(userQuestion);
            removeTypingIndicator(typingMsg);
            renderBotMessage(botReply, true);
            saveChatToLocal('bot', botReply);
        } catch (err) {
            removeTypingIndicator(typingMsg);
            renderBotMessage("Ối! Hệ thống tra cứu dữ liệu trường gặp sự cố rồi.", true);
        }
        return;
    }

    // --- THIẾT LẬP LUỒNG LIÊN KẾT LỊCH SỬ CHAT (MULTI-TURN) ---
    let systemPrompt = `Bạn là Trợ lý Ảo Tư vấn Học tập của Khoa CNTT - Đại học Văn Lang. Bạn có nhiệm vụ hướng dẫn sinh viên đăng ký môn học và lên lộ trình theo quy tắc tương tác từng bước (Multi-turn conversation).

QUY TẮC ĐỊNH DẠNG CÂU TRẢ LỜI:
- Luôn trình bày rõ ràng bằng Markdown.
- Những nhãn quan trọng phải in đậm, ví dụ: **Đáp án đúng:**, **Giải thích:**, **Kết luận:**, **Lưu ý:**.
- Mỗi ý chính viết trên một dòng riêng, không gộp toàn bộ câu trả lời thành một đoạn dài.
- Với câu hỏi trắc nghiệm, ưu tiên cấu trúc:
  **Đáp án đúng:** [chữ cái + nội dung đáp án]
  
  **Giải thích:** [giải thích ngắn gọn, dễ hiểu]
- Không lạm dụng in đậm toàn bộ câu; chỉ in đậm phần cần nhấn mạnh.

QUY TẮC ĐỌC ẢNH:
- Khi người dùng gửi ảnh, hãy đọc chữ trong ảnh trước, sau đó trả lời đúng trọng tâm câu hỏi.
- Nếu ảnh là câu hỏi trắc nghiệm, hãy xác định đáp án đúng theo các lựa chọn trong ảnh, rồi giải thích ngắn gọn.
- Nếu chữ trong ảnh bị mờ hoặc thiếu dữ liệu, hãy nói rõ phần chưa đọc chắc chắn, không bịa.

QUY TẮC TƯƠNG TÁC QUAN TRỌNG:
1. KHÔNG xả hết tất cả thông tin môn học cùng lúc nếu môn học đó có điều kiện.
2. Khi sinh viên bảo muốn học hoặc hỏi về một môn nào đó, hãy tra cứu hệ thống dữ liệu được cung cấp phía dưới:
   - Nếu môn đó CÓ "Điều kiện học trước" hoặc "Tiên quyết": Bạn PHẢI hỏi ngược lại sinh viên bằng câu hỏi dạng: "Bạn đã học và đạt môn điều kiện là [Tên môn điều kiện] của môn này chưa?" và DỪNG LẠI chờ sinh viên trả lời Có/Chưa.
   - Nếu sinh viên trả lời "Chưa/Chưa học": Hãy lịch sự nhắc nhở sinh viên phải hoàn thành môn học trước đó rồi mới được đăng ký môn hiện tại.
   - Nếu sinh viên trả lời "Có/Rồi" hoặc môn học không hề có điều kiện: Hãy tiến hành phân tích chi tiết môn học (Mã HP, số tín chỉ, học kỳ phân bổ từ dữ liệu tri thức).`;

    // Nạp kho tri thức chính thức vào System Prompt nếu phát hiện câu hỏi liên quan đến VLU
    const isVLUQuery = textLower.includes('ngành') || textLower.includes('học phần') || textLower.includes('môn') || textLower.includes('đào tạo') || textLower.includes('lộ trình') || textLower.includes('khung') || textLower.includes('chuyên ngành') || textLower.includes('tốt nghiệp') || textLower.includes('ra trường') || textLower.includes('quy chế') || textLower.includes('học phí') || textLower.includes('k30') || textLower.includes('lập trình') || textLower.includes('toán rời rạc') || textLower.includes('tiên quyết');

    if (isVLUQuery && window.vluAllKnowledgeContent) {
        systemPrompt += `\n\nCƠ SỞ DỮ LIỆU TRI THỨC CHÍNH THỨC CỦA ĐẠI HỌC VĂN LANG:\n${window.vluAllKnowledgeContent}\n\nLƯU Ý: Tuyệt đối không tự bịa đặt môn học hoặc điều kiện nằm ngoài dữ liệu trên. Định dạng câu trả lời bằng Markdown đẹp đẽ, rõ ràng.`;
    } else if (docContent) {
        systemPrompt += `\n\nNỘI DUNG TÀI LIỆU ĐÍNH KÈM:\n${docContent}`;
    }

    // Bốc lịch sử trò chuyện thực tế từ LocalStorage để gửi lên API (Giúp bot nhớ mạch Có/Chưa)
    let apiMessages = [{ role: "system", content: systemPrompt }];
    let allChats = JSON.parse(localStorage.getItem('vlu_chat_sessions')) || {};

    if (window.currentChatId && allChats[window.currentChatId]) {
        // Bỏ tin nhắn user vừa lưu ở cuối để tránh gửi trùng. Tin hiện tại sẽ được thêm bằng payload bên dưới.
        const history = allChats[window.currentChatId].messages.slice(-11, -1);
        history.forEach(msg => {
            apiMessages.push({
                role: msg.role === 'bot' ? 'assistant' : 'user',
                content: msg.text
            });
        });
    }

    let combinedText = userQuestion;
    if (docContent) combinedText = `Nội dung tài liệu: ${docContent}\n\nCâu hỏi: ${userQuestion || "Hãy tóm tắt tài liệu."}`;

    if (hasImage) {
        const contentPayload = [{ type: "text", text: combinedText || imageDefaultPrompt }];
        imagePayloads.forEach(url => {
            contentPayload.push({ type: "image_url", image_url: { url } });
        });
        apiMessages.push({ role: "user", content: contentPayload });
    } else {
        apiMessages.push({ role: "user", content: combinedText });
    }

    // --- GỌI API GROQ ---
    try {
        const model = hasImage
            ? ((window.CONFIG && window.CONFIG.GROQ_VISION_MODEL) || "meta-llama/llama-4-scout-17b-16e-instruct")
            : ((window.CONFIG && window.CONFIG.GROQ_TEXT_MODEL) || "llama-3.3-70b-versatile");

        const response = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model,
                messages: apiMessages,
                max_tokens: 2048,
                temperature: 0.2
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

    const contentDiv = document.createElement('div');
    contentDiv.className = "content";
    contentDiv.textContent = text || "";

    msgDiv.appendChild(contentDiv);
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

function formatBotAnswerText(text) {
    let formatted = String(text || "").trim();

    if (!formatted) return "";

    // Chuẩn hóa các nhãn thường gặp để khi render bằng Markdown sẽ tự in đậm và xuống dòng đẹp hơn.
    const labelRules = [
        { regex: /(^|\n|\.\s+)(Câu trả lời đúng là\s*:)/gi, label: "Câu trả lời đúng là:" },
        { regex: /(^|\n|\.\s+)(Đáp án đúng là\s*:)/gi, label: "Đáp án đúng:" },
        { regex: /(^|\n|\.\s+)(Đáp án đúng\s*:)/gi, label: "Đáp án đúng:" },
        { regex: /(^|\n|\.\s+)(Đáp án\s*:)/gi, label: "Đáp án:" },
        { regex: /(^|\n|\.\s+)(Trả lời\s*:)/gi, label: "Trả lời:" },
        { regex: /(^|\n|\.\s+)(Giải thích\s*:)/gi, label: "Giải thích:" },
        { regex: /(^|\n|\.\s+)(Kết luận\s*:)/gi, label: "Kết luận:" },
        { regex: /(^|\n|\.\s+)(Lưu ý\s*:)/gi, label: "Lưu ý:" }
    ];

    labelRules.forEach(({ regex, label }) => {
        formatted = formatted.replace(regex, (match, prefix) => {
            const separator = prefix && prefix.trim().endsWith('.') ? "\n\n" : (prefix || "");
            return `${separator}**${label}** `;
        });
    });

    // Nếu bot trả lời kiểu "b. Nội dung" sau nhãn đáp án thì giữ nó cùng dòng, nhưng tách phần giải thích ra đoạn mới.
    formatted = formatted.replace(/\s+\*\*(Giải thích|Kết luận|Lưu ý):\*\*/g, "\n\n**$1:**");

    // Tách các mục đánh số / gạch đầu dòng nếu API trả về dính liền.
    formatted = formatted.replace(/([^\n])\s+(\d+\.\s)/g, "$1\n$2");
    formatted = formatted.replace(/([^\n])\s+(-\s)/g, "$1\n$2");

    // Dọn bớt khoảng trắng thừa nhưng vẫn giữ đoạn văn dễ đọc.
    formatted = formatted.replace(/\n{3,}/g, "\n\n");

    return formatted;
}

function renderBotMessage(text) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = "message bot-message fade-in";


    const formattedText = formatBotAnswerText(text);
    let htmlContent = (typeof marked !== 'undefined') ? marked.parse(formattedText) : formattedText;
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;


    tempDiv.querySelectorAll('pre').forEach(pre => {
        let wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';


        const codeElement = pre.querySelector('code');
        let lang = 'Code';
        if (codeElement) { const langClass = Array.from(codeElement.classList).find(c => c.startsWith('language-')); if (langClass) lang = langClass.replace('language-', '').toUpperCase(); }


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
    if (!window.currentChatId) { window.currentChatId = Date.now().toString(); }
    let allChats = JSON.parse(localStorage.getItem('vlu_chat_sessions')) || {};
    if (!allChats[window.currentChatId]) {
        let titleText = text.replace(/\[Hình ảnh\]\s*/g, "");
        allChats[window.currentChatId] = { title: titleText.substring(0, 25) + (titleText.length > 25 ? '...' : ''), messages: [], timestamp: Date.now() };
    }
    allChats[window.currentChatId].messages.push({ role, text });
    localStorage.setItem('vlu_chat_sessions', JSON.stringify(allChats));


    if (window.ui && typeof window.ui.renderHistory === 'function') { window.ui.renderHistory(); }
}

function renderSession(id) {
    const container = document.getElementById('messagesContainer');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const allChats = JSON.parse(localStorage.getItem('vlu_chat_sessions')) || {};
    const chatData = allChats[id];


    if (chatData && container) {
        container.innerHTML = '';
        if (welcomeScreen) welcomeScreen.classList.add('hidden');


        chatData.messages.forEach(msg => { if (msg.role === 'user') { renderUserMessage(msg.text); } else { renderBotMessage(msg.text); } });
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


        if (id === window.currentChatId) { window.currentChatId = null; const container = document.getElementById('messagesContainer'); const welcomeScreen = document.getElementById('welcomeScreen'); if (container) container.innerHTML = ''; if (welcomeScreen) welcomeScreen.classList.remove('hidden'); }


        if (window.ui && typeof window.ui.renderHistory === 'function') { window.ui.renderHistory(); }
    }
};
document.addEventListener('DOMContentLoaded', loadKnowledgeBase);