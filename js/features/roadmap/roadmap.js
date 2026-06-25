document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Module Roadmap: khởi tạo lộ trình có ô tích và mini AI.');

    const COHORTS = {
        k30: {
            label: 'Khóa 30 - CNTT',
            targetCredits: 126,
            url: '/VLU-Chatbot/knowledge/khungK30.txt'
        },
        k29: {
            label: 'Khóa 29 trở về trước',
            targetCredits: 126,
            url: '/VLU-Chatbot/knowledge/khungK30.txt'
        }
    };

    const state = {
        cohortKey: '',
        cohortLabel: '',
        targetCredits: 126,
        rawKnowledge: '',
        courses: [],
        completedIds: new Set()
    };

    const cohortSelect = document.getElementById('cohortSelect');
    const roadmapGrid = document.getElementById('roadmapGrid');
    const summaryProgressBox = document.getElementById('summaryProgressBox');
    const roadmapToolbar = document.getElementById('roadmapToolbar');
    const creditCountEl = document.getElementById('creditCount');
    const remainingCreditsEl = document.getElementById('remainingCredits');
    const targetCreditsEl = document.getElementById('targetCredits');
    const percentTextEl = document.getElementById('percentText');
    const progressBar = document.getElementById('progressBar');
    const progressNote = document.getElementById('progressNote');
    const knowledgeContent = document.getElementById('knowledgeContent');
    const searchInput = document.getElementById('courseSearchInput');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const miniStatusCard = document.getElementById('miniStatusCard');

    if (cohortSelect) {
        cohortSelect.addEventListener('change', (event) => loadCohort(event.target.value));
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => renderRoadmap());
    }

    if (clearCompletedBtn) {
        clearCompletedBtn.addEventListener('click', () => {
            if (!state.cohortKey) return;
            if (!confirm('Bạn muốn bỏ chọn toàn bộ môn đã học?')) return;
            state.completedIds.clear();
            saveCompletedState();
            renderRoadmap();
            updateProgress();
        });
    }

    async function loadCohort(cohortKey) {
        const config = COHORTS[cohortKey];
        state.cohortKey = cohortKey;
        state.cohortLabel = config ? config.label : '';
        state.targetCredits = config ? config.targetCredits : 126;
        state.rawKnowledge = '';
        state.courses = [];
        state.completedIds = new Set();

        if (!config) {
            showEmptyState('Vui lòng chọn khóa học để hiển thị các môn dạng ô tích.');
            updateMiniStatus();
            return;
        }

        showLoadingState();

        try {
            const response = await fetch(config.url, { cache: 'no-store' });
            if (!response.ok) throw new Error('Không đọc được dữ liệu khóa học.');

            const text = await response.text();
            state.rawKnowledge = text;
            state.courses = parseCoursesFromKnowledge(text);
            state.completedIds = loadCompletedState();

            if (knowledgeContent) knowledgeContent.textContent = text;

            if (!state.courses.length) {
                showEmptyState('Chưa tách được danh sách môn học từ dữ liệu khóa này.');
                updateMiniStatus();
                return;
            }

            if (targetCreditsEl) targetCreditsEl.textContent = state.targetCredits;
            if (summaryProgressBox) summaryProgressBox.classList.remove('hidden');
            if (roadmapToolbar) roadmapToolbar.classList.remove('hidden');

            renderRoadmap();
            updateProgress();
            appendBotMessage(`Đã nạp **${state.cohortLabel}**. Bạn hãy tích các môn đã học, sau đó hỏi mình: **“Mình nên học môn nào tiếp?”**`);
        } catch (error) {
            console.error(error);
            showEmptyState('Không tải được dữ liệu khóa học. Bạn kiểm tra file /VLU-Chatbot/knowledge/khungK30.txt nhé.');
            updateMiniStatus();
        }
    }

    function parseCoursesFromKnowledge(text) {
        const lines = text.replace(/\r/g, '').split('\n');
        const courses = [];
        let currentSection = 'Khác';
        const seen = new Set();

        const nonEmptyAfter = (startIndex, limit = 12) => {
            const result = [];
            for (let i = startIndex; i < lines.length && result.length < limit; i += 1) {
                const value = lines[i].trim();
                if (value) result.push({ value, index: i });
            }
            return result;
        };

        lines.forEach((rawLine, index) => {
            const line = rawLine.trim();
            if (!line) return;

            const sectionMatch = line.match(/^\d+\.\s+(.+)/);
            if (sectionMatch) {
                currentSection = sectionMatch[1].trim();
                return;
            }

            const compactCourseMatch = line.match(/^(.+?)\s*\|\s*Mã:\s*([A-Z0-9]+)\s*\|\s*(\d+)\s*TC/i);
            if (compactCourseMatch) {
                const context = line;
                addCourse({
                    name: cleanCourseName(compactCourseMatch[1]),
                    code: compactCourseMatch[2],
                    credits: parseInt(compactCourseMatch[3], 10),
                    section: currentSection,
                    ...extractTermAndPrereq(context)
                });
                return;
            }

            const next = nonEmptyAfter(index + 1, 3);
            if (!next[0] || !/^Mã học phần:/i.test(next[0].value)) return;

            const codeLine = next[0].value;
            const contextLines = nonEmptyAfter(index, 10).map(item => item.value);
            const context = contextLines.join(' | ');
            const codeMatch = codeLine.match(/Mã học phần:\s*([A-Z0-9]+)/i);
            const creditMatch = codeLine.match(/Số tín chỉ:\s*(\d+)/i);

            if (!codeMatch || !creditMatch) return;

            addCourse({
                name: cleanCourseName(line),
                code: codeMatch[1],
                credits: parseInt(creditMatch[1], 10),
                section: currentSection,
                ...extractTermAndPrereq(context)
            });
        });

        function addCourse(course) {
            if (!course.code || seen.has(course.code)) return;
            seen.add(course.code);
            courses.push({
                id: course.code,
                code: course.code,
                name: course.name,
                credits: Number.isFinite(course.credits) ? course.credits : 0,
                year: course.year || 9,
                semester: course.semester || 9,
                section: course.section || 'Khác',
                prereqCode: course.prereqCode || '',
                prereqName: course.prereqName || ''
            });
        }

        return courses.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            if (a.semester !== b.semester) return a.semester - b.semester;
            return a.name.localeCompare(b.name, 'vi');
        });
    }

    function extractTermAndPrereq(context) {
        const termMatch = context.match(/Học kỳ:\s*(\d+)\s*,\s*Năm:\s*(\d+)/i);
        const prereqMatch = context.match(/(?:Điều kiện học trước|Tiên quyết|ĐK học trước):\s*\[([^\]]+)\]\s*([^|]+)/i);

        return {
            semester: termMatch ? parseInt(termMatch[1], 10) : 9,
            year: termMatch ? parseInt(termMatch[2], 10) : 9,
            prereqCode: prereqMatch ? prereqMatch[1].trim() : '',
            prereqName: prereqMatch ? cleanCourseName(prereqMatch[2]) : ''
        };
    }

    function cleanCourseName(name) {
        return String(name || '')
            .replace(/^[-–•]\s*/, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function renderRoadmap() {
        if (!roadmapGrid) return;

        const keyword = (searchInput ? searchInput.value : '').trim().toLowerCase();
        const courses = keyword
            ? state.courses.filter(course => `${course.name} ${course.code} ${course.section}`.toLowerCase().includes(keyword))
            : state.courses;

        if (!state.cohortKey) {
            showEmptyState('Vui lòng chọn khóa học để hiển thị các môn dạng ô tích.');
            return;
        }

        if (!courses.length) {
            roadmapGrid.innerHTML = `
                <div class="empty-state no-match">
                    <i class="fas fa-search"></i>
                    <p>Không tìm thấy môn phù hợp với từ khóa bạn nhập.</p>
                </div>
            `;
            return;
        }

        const groups = groupCoursesByTerm(courses);
        const grid = document.createElement('div');
        grid.className = 'semester-grid';

        groups.forEach(group => {
            const card = document.createElement('div');
            card.className = 'semester-card';

            const creditTotal = group.courses.reduce((sum, course) => sum + course.credits, 0);
            const courseItems = group.courses.map(course => {
                const isCompleted = state.completedIds.has(course.id);
                const prereqBadge = course.prereqCode
                    ? `<span class="badge-prereq" title="Môn học trước: ${escapeHtml(course.prereqName || course.prereqCode)}">Cần: ${escapeHtml(course.prereqCode)}</span>`
                    : '';

                return `
                    <li class="course-item ${isCompleted ? 'completed' : ''}" data-id="${escapeHtml(course.id)}" data-search="${escapeHtml(`${course.name} ${course.code} ${course.section}`.toLowerCase())}">
                        <label class="course-check-row">
                            <input class="course-checkbox" type="checkbox" data-course-id="${escapeHtml(course.id)}" ${isCompleted ? 'checked' : ''}>
                            <span class="course-main">
                                <span class="course-name-row">
                                    <span class="course-name">${escapeHtml(course.name)}</span>
                                </span>
                                <span class="course-meta">
                                    <span class="badge-code">${escapeHtml(course.code)}</span>
                                    <span class="badge-credit">${course.credits} TC</span>
                                    <span class="badge-section">${escapeHtml(shortSectionName(course.section))}</span>
                                    ${prereqBadge}
                                </span>
                            </span>
                        </label>
                    </li>
                `;
            }).join('');

            card.innerHTML = `
                <div class="semester-title">
                    <span><i class="fas fa-calendar-alt"></i> ${escapeHtml(group.title)}</span>
                    <span class="semester-credit-total">${creditTotal} TC</span>
                </div>
                <ul class="course-list">${courseItems}</ul>
            `;
            grid.appendChild(card);
        });

        roadmapGrid.innerHTML = '';
        roadmapGrid.appendChild(grid);

        roadmapGrid.querySelectorAll('.course-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', event => {
                const courseId = event.target.getAttribute('data-course-id');
                const course = state.courses.find(item => item.id === courseId);

                if (event.target.checked && course && course.prereqCode && !state.completedIds.has(course.prereqCode)) {
                    const ok = confirm(`Môn này có học phần trước là ${course.prereqCode}${course.prereqName ? ' - ' + course.prereqName : ''}.\nBạn vẫn muốn đánh dấu là đã học?`);
                    if (!ok) {
                        event.target.checked = false;
                        return;
                    }
                }

                if (event.target.checked) {
                    state.completedIds.add(courseId);
                } else {
                    state.completedIds.delete(courseId);
                }

                saveCompletedState();
                renderRoadmap();
                updateProgress();
            });
        });
    }

    function groupCoursesByTerm(courses) {
        const map = new Map();
        courses.forEach(course => {
            const title = course.year === 9 || course.semester === 9
                ? 'Chưa xác định học kỳ'
                : `Năm ${course.year} - Học kỳ ${course.semester}`;
            const sortKey = `${String(course.year).padStart(2, '0')}-${String(course.semester).padStart(2, '0')}`;
            if (!map.has(sortKey)) map.set(sortKey, { title, courses: [] });
            map.get(sortKey).courses.push(course);
        });
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
    }

    function updateProgress() {
        const completedCourses = getCompletedCourses();
        const completedCredits = completedCourses.reduce((sum, course) => sum + course.credits, 0);
        const remainingCredits = Math.max(state.targetCredits - completedCredits, 0);
        const percent = state.targetCredits ? Math.min(Math.round((completedCredits / state.targetCredits) * 100), 100) : 0;

        if (creditCountEl) creditCountEl.textContent = completedCredits;
        if (remainingCreditsEl) remainingCreditsEl.textContent = remainingCredits;
        if (targetCreditsEl) targetCreditsEl.textContent = state.targetCredits;
        if (percentTextEl) percentTextEl.textContent = `${percent}%`;
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (summaryProgressBox) summaryProgressBox.classList.toggle('hidden', !state.cohortKey);
        if (roadmapToolbar) roadmapToolbar.classList.toggle('hidden', !state.cohortKey);

        if (progressNote) {
            const remaining = getRemainingCourses();
            const next = getNextSuggestedCourses(5);
            progressNote.innerHTML = `Đã chọn <strong>${completedCourses.length}</strong> môn. Còn <strong>${remaining.length}</strong> môn chưa tích. ${next.length ? `Gợi ý tiếp theo: <strong>${escapeHtml(next.map(item => item.name).join(', '))}</strong>.` : 'Bạn đã tích gần hết danh sách môn trong dữ liệu.'}`;
        }

        updateMiniStatus();
    }

    function updateMiniStatus() {
        if (!miniStatusCard) return;

        if (!state.cohortKey) {
            miniStatusCard.innerHTML = `<strong>Chưa chọn khóa học.</strong><br>Hãy chọn khóa ở bên trái rồi tích các môn đã học để mình tư vấn đúng lộ trình của bạn.`;
            return;
        }

        const completedCredits = getCompletedCourses().reduce((sum, course) => sum + course.credits, 0);
        const remainingCredits = Math.max(state.targetCredits - completedCredits, 0);
        miniStatusCard.innerHTML = `
            <strong>${escapeHtml(state.cohortLabel)}</strong><br>
            Đã tích lũy: <strong>${completedCredits}/${state.targetCredits} TC</strong><br>
            Còn thiếu: <strong>${remainingCredits} TC</strong>
        `;
    }

    function getCompletedCourses() {
        return state.courses.filter(course => state.completedIds.has(course.id));
    }

    function getRemainingCourses() {
        return state.courses.filter(course => !state.completedIds.has(course.id));
    }

    function getNextSuggestedCourses(limit = 6) {
        const completed = state.completedIds;
        return getRemainingCourses()
            .filter(course => !course.prereqCode || completed.has(course.prereqCode))
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                if (a.semester !== b.semester) return a.semester - b.semester;
                return a.name.localeCompare(b.name, 'vi');
            })
            .slice(0, limit);
    }

    function loadCompletedState() {
        try {
            const saved = localStorage.getItem(storageKey());
            const arr = saved ? JSON.parse(saved) : [];
            return new Set(Array.isArray(arr) ? arr : []);
        } catch (_error) {
            return new Set();
        }
    }

    function saveCompletedState() {
        if (!state.cohortKey) return;
        localStorage.setItem(storageKey(), JSON.stringify(Array.from(state.completedIds)));
    }

    function storageKey() {
        return `vlu-roadmap-completed-${state.cohortKey || 'none'}`;
    }

    function showLoadingState() {
        if (summaryProgressBox) summaryProgressBox.classList.add('hidden');
        if (roadmapToolbar) roadmapToolbar.classList.add('hidden');
        if (roadmapGrid) {
            roadmapGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Đang tải và tách dữ liệu môn học...</p>
                </div>
            `;
        }
    }

    function showEmptyState(message) {
        if (summaryProgressBox) summaryProgressBox.classList.add('hidden');
        if (roadmapToolbar) roadmapToolbar.classList.add('hidden');
        if (roadmapGrid) {
            roadmapGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-graduation-cap"></i>
                    <p>${escapeHtml(message)}</p>
                </div>
            `;
        }
    }

    function shortSectionName(section) {
        const value = String(section || 'Khác');
        if (value.includes('Ngoại ngữ')) return 'Ngoại ngữ';
        if (value.includes('Thể chất') || value.includes('Quốc phòng')) return 'GDTC/QP';
        if (value.includes('Đại cương')) return 'Đại cương';
        if (value.includes('Cơ sở')) return 'Cơ sở ngành';
        if (value.includes('Chuyên')) return 'Chuyên ngành';
        if (value.includes('Tốt nghiệp')) return 'Tốt nghiệp';
        return value.length > 22 ? `${value.slice(0, 22)}...` : value;
    }

    function initRoadmapMiniBot() {
        const sendBtn = document.getElementById('miniSendBtn');
        const input = document.getElementById('miniInput');
        const chatbox = document.getElementById('miniChatbox');

        if (!sendBtn || !input) return;

        const executeChat = async () => {
            const promptText = input.value.trim();
            if (!promptText) return;

            appendUserMessage(promptText);
            input.value = '';
            scrollChatToBottom();

            if (!state.cohortKey || !state.courses.length) {
                appendBotMessage('Bạn chọn **khóa đào tạo** ở bên trái trước nha. Sau đó tích các môn đã học, mình mới vạch được lộ trình chính xác.');
                return;
            }

            if (!isRoadmapRelated(promptText)) {
                appendBotMessage('Mình chỉ hỗ trợ phần **lộ trình học tập, môn học, tín chỉ, môn tiên quyết** của khóa đang chọn. Bạn hỏi lại theo hướng môn học hoặc kế hoạch học kỳ nha.');
                return;
            }

            const typing = appendTypingMessage();
            let usedApi = false;

            try {
                const apiKey = getGroqKey();
                if (apiKey) {
                    const apiReply = await askGroq(apiKey, promptText);
                    removeMessage(typing);
                    appendBotMessage(apiReply);
                    usedApi = true;
                }
            } catch (error) {
                console.error('Mini roadmap bot API error:', error);
            }

            if (!usedApi) {
                removeMessage(typing);
                appendBotMessage(buildLocalReply(promptText));
            }

            if (chatbox) chatbox.scrollTop = chatbox.scrollHeight;
        };

        sendBtn.addEventListener('click', executeChat);
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') executeChat();
        });
    }

    function appendUserMessage(text) {
        const messages = document.getElementById('miniMessages');
        if (!messages) return null;
        const div = document.createElement('div');
        div.className = 'user-msg';
        div.innerHTML = `<div class="content">${escapeHtml(text)}</div>`;
        messages.appendChild(div);
        scrollChatToBottom();
        return div;
    }

    function appendBotMessage(text) {
        const messages = document.getElementById('miniMessages');
        if (!messages) return null;
        const div = document.createElement('div');
        div.className = 'bot-msg';
        div.innerHTML = `<div class="content">${formatBotText(text)}</div>`;
        messages.appendChild(div);
        scrollChatToBottom();
        return div;
    }

    function appendTypingMessage() {
        const messages = document.getElementById('miniMessages');
        if (!messages) return null;
        const div = document.createElement('div');
        div.className = 'bot-msg typing';
        div.innerHTML = `<div class="content"><i class="fas fa-spinner fa-spin"></i> Đang phân tích lộ trình...</div>`;
        messages.appendChild(div);
        scrollChatToBottom();
        return div;
    }

    function removeMessage(element) {
        if (element && element.parentNode) element.parentNode.removeChild(element);
    }

    function scrollChatToBottom() {
        const chatbox = document.getElementById('miniChatbox');
        if (chatbox) chatbox.scrollTop = chatbox.scrollHeight;
    }

    function getGroqKey() {
        if (window.CONFIG && window.CONFIG.GROQ_API_KEY) return window.CONFIG.GROQ_API_KEY;
        if (window.GROQ_API_KEY) return window.GROQ_API_KEY;
        return '';
    }

    async function askGroq(apiKey, promptText) {
        const completed = getCompletedCourses();
        const remaining = getRemainingCourses();
        const next = getNextSuggestedCourses(8);
        const completedCredits = completed.reduce((sum, course) => sum + course.credits, 0);
        const remainingCredits = Math.max(state.targetCredits - completedCredits, 0);

        const compactCourseList = state.courses.map(course => ({
            ma: course.code,
            ten: course.name,
            tinChi: course.credits,
            nam: course.year === 9 ? null : course.year,
            hocKy: course.semester === 9 ? null : course.semester,
            nhom: shortSectionName(course.section),
            tienQuyet: course.prereqCode || null
        }));

        const systemContext = `Bạn là Trợ lý Lộ trình Học tập của Khoa CNTT Đại học Văn Lang.

QUY TẮC BẮT BUỘC:
- Chỉ trả lời về môn học, tín chỉ, học kỳ, môn tiên quyết, môn đã học/chưa học và lộ trình đăng ký học phần của khóa đang chọn.
- Không trả lời lan man ngoài dữ liệu khóa học. Nếu câu hỏi ngoài phạm vi, nhắc người dùng hỏi về lộ trình/môn học.
- Không bịa tên môn, mã môn, tín chỉ ngoài danh sách dữ liệu.
- Trả lời ngắn gọn, có xuống dòng, dùng markdown **in đậm** các ý quan trọng.

KHÓA ĐANG CHỌN: ${state.cohortLabel}
TỔNG TÍN CHỈ YÊU CẦU: ${state.targetCredits}
ĐÃ TÍCH LŨY: ${completedCredits} tín chỉ
CÒN THIẾU: ${remainingCredits} tín chỉ
MÔN ĐÃ HỌC: ${completed.length ? completed.map(course => `${course.code} - ${course.name} (${course.credits} TC)`).join('; ') : 'Chưa tích môn nào'}
MÔN CÓ THỂ GỢI Ý TIẾP THEO: ${next.length ? next.map(course => `${course.code} - ${course.name} (${course.credits} TC)`).join('; ') : 'Chưa có gợi ý'}
TOÀN BỘ DỮ LIỆU MÔN HỌC JSON:
${JSON.stringify(compactCourseList).slice(0, 15000)}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: systemContext },
                    { role: 'user', content: promptText }
                ],
                max_tokens: 700,
                temperature: 0.25
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error && data.error.message ? data.error.message : 'Groq API error');
        }

        return data.choices?.[0]?.message?.content || buildLocalReply(promptText);
    }

    function buildLocalReply(promptText) {
        const prompt = promptText.toLowerCase();
        const completed = getCompletedCourses();
        const remaining = getRemainingCourses();
        const completedCredits = completed.reduce((sum, course) => sum + course.credits, 0);
        const remainingCredits = Math.max(state.targetCredits - completedCredits, 0);
        const next = getNextSuggestedCourses(8);
        const foundCourse = findCourseInPrompt(promptText);

        if (foundCourse) {
            const status = state.completedIds.has(foundCourse.id) ? 'đã được bạn tích là đã học' : 'chưa được tích là đã học';
            return `**Thông tin môn học:** ${foundCourse.name}\n- **Mã môn:** ${foundCourse.code}\n- **Số tín chỉ:** ${foundCourse.credits} TC\n- **Vị trí gợi ý:** ${foundCourse.year === 9 ? 'Chưa rõ học kỳ' : `Năm ${foundCourse.year} - Học kỳ ${foundCourse.semester}`}\n- **Trạng thái:** Môn này ${status}.\n${foundCourse.prereqCode ? `- **Môn học trước:** ${foundCourse.prereqCode}${foundCourse.prereqName ? ' - ' + foundCourse.prereqName : ''}` : '- **Môn học trước:** Không ghi nhận trong dữ liệu.'}`;
        }

        if (/bao nhiêu|tín chỉ|tc|còn thiếu|đủ|tiến trình|tích lũy/.test(prompt)) {
            return `**Tiến trình của bạn:**\n- Đã tích lũy: **${completedCredits}/${state.targetCredits} tín chỉ**.\n- Còn thiếu khoảng: **${remainingCredits} tín chỉ**.\n- Số môn đã tích: **${completed.length} môn**.\n- Số môn chưa tích trong dữ liệu: **${remaining.length} môn**.`;
        }

        if (/học tiếp|môn nào|nên học|lộ trình|kế hoạch|học kỳ|đăng ký/.test(prompt)) {
            if (!next.length) {
                return `**Gợi ý lộ trình:** Bạn đã tích gần hết các môn có trong dữ liệu hiện tại. Hãy kiểm tra lại các môn tự chọn/thể chất/quốc phòng và điều kiện tốt nghiệp để đủ **${state.targetCredits} tín chỉ**.`;
            }

            const list = next.map((course, index) => `${index + 1}. **${course.name}** (${course.code}) - ${course.credits} TC${course.prereqCode ? `, cần ${course.prereqCode}` : ''}`).join('\n');
            return `**Nên ưu tiên học tiếp các môn sau:**\n${list}\n\n**Lưu ý:** Mình gợi ý theo thứ tự năm/học kỳ trong khung chương trình và bỏ qua các môn có tiên quyết chưa được bạn tích.`;
        }

        return `**Mình đã đọc dữ liệu khóa ${state.cohortLabel}.**\nBạn hiện có **${completedCredits}/${state.targetCredits} tín chỉ**.\nBạn có thể hỏi: **“Mình nên học môn nào tiếp?”**, **“Môn X cần tiên quyết gì?”**, hoặc **“Mình còn thiếu bao nhiêu tín chỉ?”**`;
    }

    function findCourseInPrompt(promptText) {
        const prompt = promptText.toLowerCase();
        return state.courses.find(course => {
            const code = course.code.toLowerCase();
            const name = course.name.toLowerCase();
            return prompt.includes(code) || prompt.includes(name) || name.split(' ').filter(Boolean).slice(0, 4).join(' ').length > 8 && prompt.includes(name.split(' ').filter(Boolean).slice(0, 4).join(' '));
        });
    }

    function isRoadmapRelated(text) {
        const lower = text.toLowerCase();
        return /môn|học|tín chỉ|tc|lộ trình|học kỳ|đăng ký|tiên quyết|điều kiện|nợ|còn thiếu|tốt nghiệp|ra trường|kế hoạch|khóa|ngành|pass|rớt|học lại|học tiếp|mã môn|chuyên ngành|đại cương|anh văn|gdqp|thể chất/.test(lower);
    }

    function formatBotText(text) {
        let safe = escapeHtml(String(text || ''));
        safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
        safe = safe.replace(/\n/g, '<br>');
        return safe;
    }

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    initRoadmapMiniBot();
});
