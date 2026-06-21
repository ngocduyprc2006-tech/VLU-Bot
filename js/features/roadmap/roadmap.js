document.addEventListener('DOMContentLoaded', () => {
    console.log("📊 Module Roadmap: Đang nạp dữ liệu tri thức từ gốc...");

    let cachedKnowledgeText = "";
    const internalKnowledgeUrl = '/VLU-Chatbot/knowledge/curriculum-IT.txt';

    fetch(internalKnowledgeUrl)
        .then(res => {
            if (res.ok) return res.text();
            throw new Error("Không tìm thấy file tri thức bổ trợ.");
        })
        .then(textData => {
            cachedKnowledgeText = textData;
            const displayBox = document.getElementById('knowledgeContent');
            if (displayBox && textData) displayBox.innerText = textData;
        })
        .catch(err => console.log("Lưu ý: Chưa nạp được nội dung text bổ trợ bổ sung."));

    const roadmapData = window.VLU_ACADEMIC_KNOWLEDGE;

    const cohortSelect = document.getElementById('cohortSelect');
    const roadmapGrid = document.getElementById('roadmapGrid');
    const summaryProgressBox = document.getElementById('summaryProgressBox');
    const creditCountEl = document.getElementById('creditCount');
    const targetCreditsEl = document.getElementById('targetCredits');
    const percentTextEl = document.getElementById('percentText');
    const progressBar = document.getElementById('progressBar');

    if (!roadmapData) {
        console.error("❌ Không tìm thấy biến window.VLU_ACADEMIC_KNOWLEDGE.");
    } else {
        if (cohortSelect) {
            cohortSelect.addEventListener('change', (e) => {
                renderRoadmap(e.target.value);
            });

            if (cohortSelect.value) {
                renderRoadmap(cohortSelect.value);
            }
        }
    }

    function renderRoadmap(cohortKey) {
        if (!cohortKey || !roadmapData[cohortKey]) {
            if (summaryProgressBox) {
                summaryProgressBox.classList.add('hidden');
                summaryProgressBox.style.display = 'none';
            }
            if (roadmapGrid) {
                roadmapGrid.innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: 40px 0; width: 100%;">
                        <i class="fas fa-graduation-cap" style="font-size: 48px; color: #ccc; margin-bottom: 12px;"></i>
                        <p style="color: #888; margin: 0;">Vui lòng chọn khóa học để hiển thị lộ trình chi tiết phần mềm.</p>
                    </div>
                `;
            }
            return;
        }

        const data = roadmapData[cohortKey];
        if (targetCreditsEl) targetCreditsEl.innerText = data.targetCredits;

        if (summaryProgressBox) {
            summaryProgressBox.classList.remove('hidden');
            summaryProgressBox.style.display = 'block';
        }
        if (roadmapGrid) roadmapGrid.innerHTML = '';

        data.semesters.forEach(sem => {
            const card = document.createElement('div');
            card.className = 'semester-card';

            let coursesHTML = '';
            sem.courses.forEach(course => {
                const prereqAttr = course.prereq ? `data-prereq="${course.prereq}"` : '';
                const prereqBadge = course.prereq ? `<span class="badge-prereq">Cần Pass: ${course.prereqName}</span>` : '';

                coursesHTML += `
                    <li class="course-item" data-id="${course.id}">
                        <input type="checkbox" id="chk-${course.id}" data-credits="${course.credits}" ${prereqAttr}>
                        <div class="course-label">
                            <div class="course-info-row">
                                <span style="font-weight:600;">${course.name}</span>
                            </div>
                            <div class="course-meta">
                                <span class="badge-code">${course.id}</span>
                                <span class="badge-credit">${course.credits} TC</span>
                                ${prereqBadge}
                            </div>
                        </div>
                    </li>
                `;
            });

            card.innerHTML = `
                <div class="semester-title"><i class="fas fa-calendar-alt"></i> ${sem.title}</div>
                <ul class="course-list">${coursesHTML}</ul>
            `;
            if (roadmapGrid) roadmapGrid.appendChild(card);
        });

        initCheckboxLogic(data.targetCredits);
    }

    function initCheckboxLogic(targetCredits) {
        const checkboxes = document.querySelectorAll('.course-item input[type="checkbox"]');

        function updateProgress() {
            let currentCredits = 0;
            checkboxes.forEach(cb => {
                const item = cb.closest('.course-item');
                if (cb.checked) {
                    currentCredits += parseInt(cb.getAttribute('data-credits') || 0);
                    if (item) item.classList.add('completed');
                } else {
                    if (item) item.classList.remove('completed');
                }
            });

            if (creditCountEl) creditCountEl.innerText = currentCredits;
            const percentage = Math.min(Math.round((currentCredits / targetCredits) * 100), 100);
            if (percentTextEl) percentTextEl.innerText = percentage + '%';
            if (progressBar) progressBar.style.width = percentage + '%';
        }

        checkboxes.forEach(cb => {
            cb.addEventListener('change', function(e) {
                const prereqId = this.getAttribute('data-prereq');

                if (prereqId && this.checked) {
                    const prereqCb = document.getElementById(`chk-${prereqId}`);
                    if (prereqCb && !prereqCb.checked) {
                        alert(`🚫 Không thể chọn môn học này!\nBạn phải hoàn thành học phần tiên quyết [Mã môn: ${prereqId}] trước.`);
                        this.checked = false;
                        return;
                    }
                }

                if (!this.checked) {
                    const targetId = this.id.replace('chk-', '');
                    checkboxes.forEach(childCb => {
                        if (childCb.getAttribute('data-prereq') === targetId && childCb.checked) {
                            childCb.checked = false;
                            const childItem = childCb.closest('.course-item');
                            if (childItem) childItem.classList.remove('completed');
                        }
                    });
                }

                updateProgress();
            });

            const item = cb.closest('.course-item');
            if (item) {
                item.addEventListener('click', function(e) {
                    if (e.target !== cb) {
                        cb.checked = !cb.checked;
                        cb.dispatchEvent(new Event('change'));
                    }
                });
            }
        });
    }

    function initRoadmapMiniBot() {
        const sendBtn = document.getElementById('miniSendBtn');
        const input = document.getElementById('miniInput');
        const messages = document.getElementById('miniMessages');
        const chatboxContainer = document.getElementById('miniChatbox');

        if (!sendBtn || !input || !messages) return;

        const executeChat = async() => {
            const promptText = input.value.trim();
            if (!promptText) return;

            messages.innerHTML += `<div class="user-msg" style="text-align: right; margin: 8px 0;"><div style="display: inline-block; background: #e00000; color: #fff; padding: 8px 12px; border-radius: 8px; max-width: 85%; font-size: 13px; text-align: left;">${escapeHtml(promptText)}</div></div>`;
            input.value = '';
            if (chatboxContainer) chatboxContainer.scrollTop = chatboxContainer.scrollHeight;

            const typingDiv = document.createElement('div');
            typingDiv.className = 'bot-msg typing';
            typingDiv.style.margin = '8px 0';
            typingDiv.innerHTML = `<div style="display: inline-block; background: #f1f5f9; color: #333; padding: 8px 12px; border-radius: 8px; max-width: 85%; font-size: 13px;"><i class="fas fa-spinner fa-spin"></i> Đang phân tích...</div>`;
            messages.appendChild(typingDiv);
            if (chatboxContainer) chatboxContainer.scrollTop = chatboxContainer.scrollHeight;

            let apiKey = "";
            if (typeof window.CONFIG !== "undefined" && window.CONFIG.GROQ_API_KEY) {
                apiKey = window.CONFIG.GROQ_API_KEY;
            }

            if (!apiKey) {
                if (typingDiv.parentNode) typingDiv.parentNode.removeChild(typingDiv);
                renderMiniReply("Hệ thống chưa cấu hình API Key trong file config.js!");
                return;
            }

            let systemContext = "Bạn là trợ lý tư vấn lộ trình học tập thuộc Khoa Công nghệ thông tin Đại học Văn Lang.";
            if (cachedKnowledgeText) {
                systemContext += ` Sử dụng tài liệu tri thức học vụ sau đây để trả lời chính xác câu hỏi của sinh viên:\n\n${cachedKnowledgeText}`;
            }

            try {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "llama-3.1-8b-instant",
                        messages: [
                            { role: "system", content: systemContext },
                            { role: "user", content: promptText }
                        ],
                        max_tokens: 800,
                        temperature: 0.4
                    })
                });

                const data = await response.json();
                if (typingDiv.parentNode) typingDiv.parentNode.removeChild(typingDiv);

                if (data.choices && data.choices[0] && data.choices[0].message) {
                    renderMiniReply(data.choices[0].message.content);
                } else {
                    renderMiniReply("Hệ thống xử lý bận, vui lòng thử lại câu hỏi!");
                }
            } catch (err) {
                if (typingDiv.parentNode) typingDiv.parentNode.removeChild(typingDiv);
                renderMiniReply("Lỗi kết nối máy chủ dữ liệu chatbot!");
                console.error(err);
            }
        };

        function renderMiniReply(text) {
            const botMsgDiv = document.createElement('div');
            botMsgDiv.className = 'bot-msg';
            botMsgDiv.style.margin = '8px 0';
            botMsgDiv.innerHTML = `<div style="display: inline-block; background: #f1f5f9; color: #333; padding: 8px 12px; border-radius: 8px; max-width: 85%; font-size: 13px; line-height: 1.5;">${text.replace(/\n/g, '<br>')}</div>`;
            messages.appendChild(botMsgDiv);
            if (chatboxContainer) chatboxContainer.scrollTop = chatboxContainer.scrollHeight;
        }

        sendBtn.onclick = executeChat;
        input.onkeydown = (e) => { if (e.key === 'Enter') executeChat(); };
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    initRoadmapMiniBot();
});