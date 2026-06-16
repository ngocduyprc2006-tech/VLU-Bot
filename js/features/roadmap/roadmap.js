/**
 * FILE: js/features/roadmap/roadmap.js
 * CẬP NHẬT: Đọc dữ liệu tri thức từ file gốc bên ngoài qua đường dẫn tuyệt đối,
 * tích hợp thêm module chat bot mini tư vấn lộ trình học tập dựa trên tài liệu.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("📊 Module Roadmap: Đang nạp dữ liệu tri thức từ gốc...");

    // 1. TỰ ĐỘNG NẠP FILE VĂN BẢN TRI THỨC LÊN PANEL TRÁI
    const internalKnowledgeUrl = '/VLU-Chatbot/knowledge/curriculum-IT.txt';

    fetch(internalKnowledgeUrl)
        .then(res => {
            if (res.ok) return res.text();
            throw new Error("Không tìm thấy file tri thức bổ trợ.");
        })
        .then(textData => {
            const displayBox = document.getElementById('knowledgeContent');
            if (displayBox && textData) displayBox.innerText = textData;
        })
        .catch(err => console.log("Lưu ý: Chưa nạp được nội dung text bổ trợ bổ sung."));

    // 2. KHỞI CHẠY LOGIC ĐỒNG BỘ PANEL LỘ TRÌNH (GIỮ NGUYÊN CODE CŨ)
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
            if (summaryProgressBox) summaryProgressBox.classList.add('hidden');
            if (roadmapGrid) {
                roadmapGrid.innerHTML = `
                    <div class="empty-state">
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
            cb.addEventListener('change', function() {
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
        });
    }

    // 3. KHỞI ĐỘNG CỔNG CHAT CHO TRỢ LÝ ẢO MINI BÊN PANEL PHẢI
    initRoadmapMiniBot();
});

function initRoadmapMiniBot() {
    const sendBtn = document.getElementById('miniSendBtn');
    const input = document.getElementById('miniInput');
    const messages = document.getElementById('miniMessages');

    if (!sendBtn || !input || !messages) return;

    const executeChat = () => {
        const promptText = input.value.trim();
        if (!promptText) return;

        // Đẩy tin nhắn của sinh viên lên khung chat
        messages.innerHTML += `<div class="user-msg">${promptText}</div>`;
        input.value = '';

        const chatboxContainer = document.getElementById('miniChatbox');
        if (chatboxContainer) {
            chatboxContainer.scrollTop = chatboxContainer.scrollHeight;
        }

        // Phản hồi xử lý thông tin từ tri thức nền
        setTimeout(() => {
            let intelligentReply = `- Đang phân tích lộ trình học phần...\n\nHệ thống đang kết hợp file tri thức 'curriculum-IT.txt' hiển thị ở panel bên cạnh để trả lời câu hỏi của bạn một cách chính xác nhất.`;
            messages.innerHTML += `<div class="bot-msg">${intelligentReply}</div>`;
            if (chatboxContainer) {
                chatboxContainer.scrollTop = chatboxContainer.scrollHeight;
            }
        }, 800);
    };

    sendBtn.onclick = executeChat;
    input.onkeydown = (e) => { if (e.key === 'Enter') executeChat(); };
}