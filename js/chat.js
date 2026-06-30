const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

window.currentChatId = null;
window.vluAllKnowledgeContent = "";
window.vluCurriculumK30Content = "";

function getApiKey() {
    return (typeof window.CONFIG !== "undefined" && window.CONFIG.GROQ_API_KEY) ? window.CONFIG.GROQ_API_KEY : "";
}

async function loadKnowledgeBase() {
    const knowledgeRoots = ['/knowledge', '/VLU-Chatbot/knowledge'];
    let combinedData = "";
    let curriculumK30 = "";

    for (const root of knowledgeRoots) {
        try {
            const listResponse = await fetch(`${root}/list.json`);
            if (!listResponse.ok) continue;

            const fileList = await listResponse.json();

            for (const fileName of fileList) {
                try {
                    const fileResponse = await fetch(`${root}/${fileName}`);
                    if (fileResponse.ok) {
                        const fileText = await fileResponse.text();
                        combinedData += `--- NỘI DUNG TỆP TRI THỨC CHÍNH THỨC: ${fileName} ---
${fileText}

`;

                        if (fileName.toLowerCase().includes('khungk30') || fileName.toLowerCase().includes('curriculum')) {
                            curriculumK30 += `--- KHUNG CHƯƠNG TRÌNH K30: ${fileName} ---
${fileText}

`;
                        }
                    }
                } catch (fileErr) { console.error(`Không thể nạp tệp ${root}/${fileName}:`, fileErr); }
            }
        } catch (err) { console.warn(`Không thể nạp danh mục tri thức từ ${root}:`, err); }
    }

    // Fallback trực tiếp để tránh lỗi sai đường dẫn list.json khi deploy Firebase.
    if (!curriculumK30) {
        for (const root of knowledgeRoots) {
            try {
                const directResponse = await fetch(`${root}/khungK30.txt`);
                if (directResponse.ok) {
                    const fileText = await directResponse.text();
                    curriculumK30 += `--- KHUNG CHƯƠNG TRÌNH K30: khungK30.txt ---
${fileText}

`;
                    combinedData += `--- NỘI DUNG TỆP TRI THỨC CHÍNH THỨC: khungK30.txt ---
${fileText}

`;
                    break;
                }
            } catch (err) { console.warn(`Không thể nạp trực tiếp khungK30 từ ${root}:`, err); }
        }
    }

    window.vluAllKnowledgeContent = combinedData;
    window.vluCurriculumK30Content = curriculumK30;
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

    // Bảo đảm đã nạp khung chương trình K30 trước khi gửi câu hỏi lên AI.
    if (!window.vluAllKnowledgeContent && typeof loadKnowledgeBase === 'function') {
        await loadKnowledgeBase();
    }

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

    const imageDefaultPrompt = "Hãy đọc nội dung trong ảnh và trả lời rõ ràng bằng tiếng Việt. Nếu ảnh là câu hỏi trắc nghiệm, hãy chọn đáp án đúng và giải thích ngắn gọn. Nếu ảnh là bảng điểm/kết quả học tập, KHÔNG được tính tổng ngay. Trước tiên phải in ra bảng tất cả môn đã đọc được từ ảnh theo từng học kỳ: Mã môn, tên môn, tín chỉ, điểm hệ 10, điểm hệ 4, điểm chữ, kết quả. Sau khi đã liệt kê dữ liệu đọc được, mới lập các bảng tổng hợp: tổng tín chỉ đã đạt, môn không tính tín chỉ, môn chưa đạt, môn còn thiếu khi đối chiếu khung CTĐT K30 CNTT. Chỉ tính theo dữ liệu nhìn thấy rõ trong ảnh; nếu ảnh nhỏ/mờ/không thấy hết, phải nói rõ chưa đủ dữ liệu, không được tự suy đoán. Tuyệt đối không dùng tổng 126 TC của chương trình làm tín chỉ đã học. Tuyệt đối không liệt kê một môn là còn thiếu nếu môn đó đã xuất hiện trong ảnh bảng điểm với trạng thái đạt hoặc điểm chữ đạt.";
    const userQuestion = text || (hasImage ? imageDefaultPrompt : "");

    // Hiển thị tin nhắn người dùng
    if (hasImage) {
        renderUserImageGridMessage(imagePayloads);
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

QUY TẮC ĐỌC ẢNH BẢNG ĐIỂM / KẾT QUẢ HỌC TẬP:
- Nếu người dùng chụp bảng điểm, hãy trích xuất dữ liệu theo từng dòng môn học: Học kỳ, mã môn, tên môn, số tín chỉ, điểm hệ 10, điểm hệ 4, điểm chữ, kết quả.
- Nếu người dùng gửi nhiều ảnh, hãy xem đó là các phần của cùng một bảng điểm. Ghép dữ liệu lại theo đúng thứ tự học kỳ và KHÔNG tính trùng môn.
- BẮT BUỘC LÀM THEO THỨ TỰ NÀY, KHÔNG ĐƯỢC NHẢY THẲNG VÀO TỔNG HỢP:
  **Bước 1:** In ra toàn bộ dữ liệu môn học đọc được từ ảnh, chia theo từng học kỳ bằng bảng Markdown. Bảng phải có cột: Học kỳ | Mã môn | Tên môn | TC | Điểm 10 | Điểm 4 | Điểm chữ | Kết quả | Tính TC?
  **Bước 2:** Sau khi đã liệt kê dữ liệu đọc được, mới cộng tín chỉ và lập bảng tổng quan.
  **Bước 3:** Cuối cùng mới đối chiếu khung CTĐT K30 CNTT để liệt kê môn còn thiếu/cần học tiếp.
- Tuyệt đối KHÔNG dùng tổng 126 TC của chương trình làm tín chỉ đã học. 126 TC chỉ là mốc yêu cầu để tốt nghiệp.
- Tổng tín chỉ đã đạt phải lấy theo một trong hai cách sau:
  1) Ưu tiên dùng dòng "Tổng số tín chỉ tích lũy" hoặc "Tổng số tín chỉ đã đạt" nhìn thấy rõ trong ảnh.
  2) Nếu không thấy dòng tổng, tự cộng từ các môn đọc được rõ ràng và đã đạt.
- Nếu ảnh nhỏ/mờ, chỉ thấy thumbnail, thiếu cột hoặc không đọc chắc số tín chỉ/điểm, hãy nói: "Ảnh chưa đủ rõ để tính chính xác" và KHÔNG được tự suy đoán thành số lớn.
- Tín chỉ đã học chỉ tính các môn có trạng thái Đạt/Passed/dấu tick xanh hoặc điểm chữ đạt: A+, A, B+, B, C+, C, D+, D, P. Không tính môn Rớt, F, Học lại, Chưa đạt, Vắng thi, MT, điểm bảo lưu 0 tín chỉ.
- Các môn Giáo dục quốc phòng, Giáo dục thể chất, kiểm tra tiếng Anh đầu khóa, chứng chỉ/điều kiện đầu ra có thể hiển thị trong bảng đã đọc được nhưng nếu cột tín chỉ là 0 hoặc là điều kiện riêng thì ghi "Không tính TC".
- Khi đối chiếu với khung CTĐT K30 CNTT, bắt buộc dùng thuật toán đối chiếu hai lớp:
  1) Ưu tiên so mã môn/mã học phần.
  2) Nếu mã khác hoặc ảnh mờ, so tên môn gần giống không phân biệt hoa thường/dấu câu/dấu tiếng Việt.
- TUYỆT ĐỐI KHÔNG được đưa một môn vào danh sách "còn thiếu" nếu môn đó đã xuất hiện trong bảng điểm với trạng thái đạt. Ví dụ nếu ảnh đã có "Lập trình hướng đối tượng", "Các nền tảng phát triển phần mềm", "Lập trình ứng dụng Web", "Cấu trúc dữ liệu và giải thuật", "Toán rời rạc" thì các môn này phải được xếp vào nhóm ĐÃ ĐẠT, không được liệt kê lại là thiếu.
- Nếu chưa chắc môn đã đạt hay chưa do ảnh mờ, hãy đặt vào mục "Cần kiểm tra lại" thay vì kết luận thiếu.
- Khi người dùng hỏi đã học bao nhiêu tín chỉ/còn thiếu gì, phải trình bày bằng Markdown table, không viết một đoạn dài. Cấu trúc bắt buộc:

  **1. Dữ liệu bảng điểm đọc được**
  | Học kỳ | Mã môn | Tên môn | TC | Điểm 10 | Điểm 4 | Điểm chữ | Kết quả | Tính TC? |
  |---|---|---|---:|---:|---:|---|---|---|

  **2. Tổng quan tín chỉ**
  | Hạng mục | Kết quả |
  |---|---|
  | Tổng tín chỉ đã đạt | ... / 126 TC |
  | Tín chỉ còn thiếu | ... TC |
  | Số môn đã đọc được | ... môn |
  | Số môn không tính TC | ... môn |
  | Mức độ chắc chắn | Cao/Trung bình/Thấp + lý do |

  **3. Thống kê theo nhóm môn**
  | Nhóm môn | Đã đạt | Còn thiếu | Ghi chú |
  |---|---:|---:|---|
  | Cơ sở khối ngành | ... | ... | ... |
  | Cơ sở ngành | ... | ... | ... |
  | Chuyên ngành/chuyên sâu | ... | ... | ... |

  **4. Môn còn thiếu / cần học tiếp**
  | Ưu tiên | Nhóm | Mã môn | Tên môn | TC | Lý do |
  |---:|---|---|---|---:|---|

  **5. Môn chưa đạt / cần học lại**
  | Mã môn | Tên môn | Điểm chữ | Ghi chú |
  |---|---|---|---|

  **6. Gợi ý học kỳ tiếp theo**
  | Thứ tự | Môn nên học | Lý do |
  |---:|---|---|
- Nếu ảnh bảng điểm không đủ toàn bộ học kỳ hoặc không đọc được hết, hãy mở đầu bằng câu: "Mình chỉ tính theo phần bảng điểm đọc được trong ảnh." và yêu cầu gửi thêm ảnh/phần còn thiếu.
- Không tự bịa điểm, tín chỉ hoặc môn đã học nếu không đọc được trong ảnh.

QUY TẮC TƯƠNG TÁC QUAN TRỌNG:
1. KHÔNG xả hết tất cả thông tin môn học cùng lúc nếu môn học đó có điều kiện.
2. Khi sinh viên bảo muốn học hoặc hỏi về một môn nào đó, hãy tra cứu hệ thống dữ liệu được cung cấp phía dưới:
   - Nếu môn đó CÓ "Điều kiện học trước" hoặc "Tiên quyết": Bạn PHẢI hỏi ngược lại sinh viên bằng câu hỏi dạng: "Bạn đã học và đạt môn điều kiện là [Tên môn điều kiện] của môn này chưa?" và DỪNG LẠI chờ sinh viên trả lời Có/Chưa.
   - Nếu sinh viên trả lời "Chưa/Chưa học": Hãy lịch sự nhắc nhở sinh viên phải hoàn thành môn học trước đó rồi mới được đăng ký môn hiện tại.
   - Nếu sinh viên trả lời "Có/Rồi" hoặc môn học không hề có điều kiện: Hãy tiến hành phân tích chi tiết môn học (Mã HP, số tín chỉ, học kỳ phân bổ từ dữ liệu tri thức).`;

    // Nạp kho tri thức chính thức vào System Prompt nếu phát hiện câu hỏi liên quan đến VLU hoặc bảng điểm.
    const isTranscriptQuery = hasImage || (
        textLower.includes('bảng điểm') ||
        textLower.includes('kết quả học tập') ||
        textLower.includes('tín chỉ') ||
        textLower.includes('đã học') ||
        textLower.includes('còn thiếu') ||
        textLower.includes('cơ sở khối ngành') ||
        textLower.includes('cơ sở ngành') ||
        textLower.includes('chuyên ngành') ||
        textLower.includes('môn tiếp') ||
        textLower.includes('học tiếp') ||
        textLower.includes('lộ trình') ||
        textLower.includes('tốt nghiệp') ||
        textLower.includes('ra trường') ||
        !text
    );

    const isVLUQuery = isTranscriptQuery || textLower.includes('ngành') || textLower.includes('học phần') || textLower.includes('môn') || textLower.includes('đào tạo') || textLower.includes('lộ trình') || textLower.includes('khung') || textLower.includes('chuyên ngành') || textLower.includes('cơ sở ngành') || textLower.includes('bảng điểm') || textLower.includes('kết quả học tập') || textLower.includes('tín chỉ') || textLower.includes('tốt nghiệp') || textLower.includes('ra trường') || textLower.includes('quy chế') || textLower.includes('học phí') || textLower.includes('k30') || textLower.includes('lập trình') || textLower.includes('toán rời rạc') || textLower.includes('tiên quyết');

    if (isTranscriptQuery && window.vluCurriculumK30Content) {
        systemPrompt += `

KHUNG CHƯƠNG TRÌNH K30 CNTT ĐỂ ĐỐI CHIẾU BẢNG ĐIỂM:
${window.vluCurriculumK30Content}

LƯU Ý BẮT BUỘC: Chỉ dùng khung chương trình trên để đối chiếu môn còn thiếu, KHÔNG dùng khung chương trình để suy ra sinh viên đã học đủ tín chỉ. Không tự bịa môn học, mã môn, số tín chỉ hoặc điều kiện tiên quyết. Khi phân tích bảng điểm, ưu tiên các nhóm Công nghệ thông tin: Kiến thức cơ sở khối ngành, Kiến thức cơ sở ngành, Kiến thức chuyên ngành/chuyên sâu. Phải đối chiếu cả mã môn và tên môn; môn nào đã xuất hiện trong ảnh bảng điểm với trạng thái đạt thì không được liệt kê là còn thiếu. Nếu ảnh bảng điểm không đủ dữ liệu, hãy nói rõ phạm vi tính toán. Bắt buộc in bảng "Dữ liệu bảng điểm đọc được" trước, sau đó mới lập bảng tổng hợp và đối chiếu môn thiếu.`;
    } else if (isVLUQuery && window.vluAllKnowledgeContent) {
        systemPrompt += `

CƠ SỞ DỮ LIỆU TRI THỨC CHÍNH THỨC CỦA ĐẠI HỌC VĂN LANG:
${window.vluAllKnowledgeContent}

LƯU Ý: Tuyệt đối không tự bịa đặt môn học hoặc điều kiện nằm ngoài dữ liệu trên. Định dạng câu trả lời bằng Markdown đẹp đẽ, rõ ràng.`;
    } else if (docContent) {
        systemPrompt += `

NỘI DUNG TÀI LIỆU ĐÍNH KÈM:
${docContent}`;
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
                max_tokens: 6000,
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

function renderUserImageGridMessage(urls) {
    const container = document.getElementById('messagesContainer');
    if (!container || !Array.isArray(urls) || urls.length === 0) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = "message user-message user-image-grid-message fade-in";

    const contentDiv = document.createElement('div');
    contentDiv.className = "content";

    const gridDiv = document.createElement('div');
    gridDiv.className = "user-image-grid";
    if (urls.length === 1) gridDiv.classList.add('single-image');

    urls.forEach((url, index) => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = `Ảnh đã gửi ${index + 1}`;
        img.loading = 'lazy';
        gridDiv.appendChild(img);
    });

    contentDiv.appendChild(gridDiv);
    msgDiv.appendChild(contentDiv);
    container.appendChild(msgDiv);
    scrollToBottom();
}

function renderUserImageMessage(url) {
    renderUserImageGridMessage([url]);
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
        { regex: /(^|\n|\.\s+)(Tổng quan\s*:)/gi, label: "Tổng quan:" },
        { regex: /(^|\n|\.\s+)(Tổng quan tín chỉ\s*:)/gi, label: "Tổng quan tín chỉ:" },
        { regex: /(^|\n|\.\s+)(Thống kê theo nhóm môn\s*:)/gi, label: "Thống kê theo nhóm môn:" },
        { regex: /(^|\n|\.\s+)(Môn đã đạt quan trọng\s*:)/gi, label: "Môn đã đạt quan trọng:" },
        { regex: /(^|\n|\.\s+)(Môn còn thiếu\s*\/\s*cần học tiếp\s*:)/gi, label: "Môn còn thiếu / cần học tiếp:" },
        { regex: /(^|\n|\.\s+)(Môn chưa đạt\s*\/\s*cần học lại\s*:)/gi, label: "Môn chưa đạt / cần học lại:" },
        { regex: /(^|\n|\.\s+)(Gợi ý học kỳ tiếp theo\s*:)/gi, label: "Gợi ý học kỳ tiếp theo:" },
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
    formatted = formatted.replace(/\s+\*\*((Giải thích|Tổng quan|Tổng quan tín chỉ|Thống kê theo nhóm môn|Môn đã đạt quan trọng|Môn còn thiếu \/ cần học tiếp|Môn chưa đạt \/ cần học lại|Gợi ý học kỳ tiếp theo|Kết luận|Lưu ý)):\*\*/g, "\n\n**$1:**");

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
window.loadKnowledgeBase = loadKnowledgeBase;
document.addEventListener('DOMContentLoaded', loadKnowledgeBase);