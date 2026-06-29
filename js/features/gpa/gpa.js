/**
 * FILE: js/features/gpa/gpa.js
 * Mục tiêu: Trang Kết quả học tập chỉ là giao diện thiết kế sẵn.
 * Không tự tạo điểm giả. Khi chưa kết nối dữ liệu học vụ, toàn bộ bảng điểm/GPA hiển thị trạng thái chờ đồng bộ.
 */

(() => {
    const TOTAL_PROGRAM_CREDITS = 126;
    let courseData = [];

    document.addEventListener('DOMContentLoaded', () => {
        if (!document.querySelector('.gpa-page')) return;

        loadKnowledgeFile();
        bindEvents();
        renderDashboard();
        initMiniBot();
    });

    function bindEvents() {
        const semesterFilter = document.getElementById('semesterFilter');
        const courseSearch = document.getElementById('courseSearch');
        const refreshDemoBtn = document.getElementById('refreshDemoBtn');
        const convertBtn = document.getElementById('convertBtn');
        const scoreInput = document.getElementById('scoreInput');
        const toggleKnowledgeBtn = document.getElementById('toggleKnowledgeBtn');

        semesterFilter?.addEventListener('change', renderDashboard);
        courseSearch?.addEventListener('input', renderCourseTable);
        refreshDemoBtn?.addEventListener('click', () => {
            renderDashboard();
            addBotMessage('Hiện trang <strong>chưa kết nối dữ liệu điểm thật</strong> từ hệ thống học vụ, nên mình không hiển thị điểm/GPA giả. Sau này khi có API hoặc file dữ liệu từ trường, bảng điểm sẽ tự đổ vào đây.');
        });
        convertBtn?.addEventListener('click', convertScore);
        scoreInput?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') convertScore();
        });
        toggleKnowledgeBtn?.addEventListener('click', () => {
            document.getElementById('knowledgeContent')?.classList.toggle('is-collapsed');
        });
    }

    function getFilteredCourses() {
        const semester = document.getElementById('semesterFilter')?.value || 'all';
        if (semester === 'all') return [...courseData];
        return courseData.filter(course => course.semester === semester);
    }

    function getDisplayedCourses() {
        const keyword = (document.getElementById('courseSearch')?.value || '').trim().toLowerCase();
        const filtered = getFilteredCourses();
        if (!keyword) return filtered;

        return filtered.filter(course => {
            return course.code.toLowerCase().includes(keyword) ||
                course.name.toLowerCase().includes(keyword) ||
                course.area.toLowerCase().includes(keyword);
        });
    }

    function renderDashboard() {
        renderSummaryCards();
        renderProgress();
        renderSemesterBars();
        renderInsights();
        renderCourseTable();
    }

    function renderSummaryCards() {
        const summaryGrid = document.getElementById('summaryGrid');
        if (!summaryGrid) return;

        const courses = getFilteredCourses();
        const stats = calculateStats(courses);
        const hasData = courses.length > 0;
        const riskCount = courses.filter(course => course.score < 5).length;
        const improvementCount = courses.filter(course => course.score >= 5 && course.score < 6.5).length;
        const rating = hasData ? getRating(stats.gpa4) : { title: 'Chờ dữ liệu', note: 'Chưa liên kết bảng điểm thật.' };

        const cards = [
            {
                icon: 'fa-chart-simple',
                label: 'GPA hệ 4',
                value: hasData ? stats.gpa4.toFixed(2) : '—',
                note: hasData ? `Điểm TB hệ 10: ${stats.avg10.toFixed(2)}` : 'Sẽ hiển thị sau khi đồng bộ điểm'
            },
            {
                icon: 'fa-book-open-reader',
                label: 'Tín chỉ đạt',
                value: hasData ? `${stats.passedCredits}/${TOTAL_PROGRAM_CREDITS}` : `0/${TOTAL_PROGRAM_CREDITS}`,
                note: hasData ? `Tổng đã học: ${stats.attemptedCredits} TC` : 'Chưa có tín chỉ từ bảng điểm'
            },
            {
                icon: 'fa-triangle-exclamation',
                label: 'Cần lưu ý',
                value: hasData ? `${riskCount + improvementCount}` : '—',
                note: hasData ? `${riskCount} môn chưa đạt, ${improvementCount} môn nên cải thiện` : 'Chưa thể phân tích khi chưa có điểm'
            },
            {
                icon: 'fa-award',
                label: 'Xếp loại tạm tính',
                value: rating.title,
                note: rating.note
            }
        ];

        summaryGrid.innerHTML = cards.map(card => `
            <div class="summary-card">
                <div class="card-icon"><i class="fas ${card.icon}"></i></div>
                <p>${card.label}</p>
                <strong>${card.value}</strong>
                <span>${card.note}</span>
            </div>
        `).join('');
    }

    function renderProgress() {
        const courses = getFilteredCourses();
        const stats = calculateStats(courses);
        const percent = Math.min(100, Math.round((stats.passedCredits / TOTAL_PROGRAM_CREDITS) * 100));

        const progressBar = document.getElementById('creditProgressBar');
        const progressChip = document.getElementById('progressChip');
        const passedCreditText = document.getElementById('passedCreditText');
        const missingCreditText = document.getElementById('missingCreditText');

        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressChip) progressChip.textContent = `${stats.passedCredits}/${TOTAL_PROGRAM_CREDITS} TC`;
        if (passedCreditText) passedCreditText.textContent = stats.attemptedCredits ? `Đã đạt: ${stats.passedCredits} tín chỉ (${percent}%)` : 'Đã đạt: chờ đồng bộ dữ liệu';
        if (missingCreditText) missingCreditText.textContent = stats.attemptedCredits ? `Còn thiếu: ${Math.max(0, TOTAL_PROGRAM_CREDITS - stats.passedCredits)} tín chỉ` : 'Còn thiếu: chưa xác định';
    }

    function renderSemesterBars() {
        const container = document.getElementById('semesterBars');
        if (!container) return;

        if (!courseData.length) {
            container.innerHTML = `
                <div class="empty-state compact">
                    <i class="fas fa-cloud-arrow-down"></i>
                    <strong>Chưa có dữ liệu GPA theo học kỳ</strong>
                    <p>Khi liên kết được bảng điểm từ hệ thống của trường, biểu đồ từng học kỳ sẽ hiện ở đây.</p>
                </div>
            `;
            return;
        }

        const semesters = [...new Set(courseData.map(course => course.semester))];
        container.innerHTML = semesters.map(semester => {
            const courses = courseData.filter(course => course.semester === semester);
            const gpa = calculateStats(courses).gpa4;
            const width = Math.max(8, Math.round((gpa / 4) * 100));
            return `
                <div class="semester-bar-row">
                    <span>${semester}</span>
                    <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
                    <strong>${gpa.toFixed(2)}</strong>
                </div>
            `;
        }).join('');
    }

    function renderCourseTable() {
        const tableBody = document.getElementById('courseTableBody');
        if (!tableBody) return;

        const courses = getDisplayedCourses();

        if (!courses.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-table-cell">
                        <div class="empty-state">
                            <i class="fas fa-file-circle-question"></i>
                            <strong>Chưa có bảng điểm thật</strong>
                            <p>Phần này chỉ là giao diện chuẩn bị sẵn. Sau này khi liên kết dữ liệu học vụ của trường, danh sách môn, điểm, tín chỉ và trạng thái sẽ tự hiển thị tại đây.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = courses.map(course => {
            const grade = scoreToGrade(course.score);
            const status = getCourseStatus(course.score);
            return `
                <tr>
                    <td><strong>${course.code}</strong><br><small>${course.semester}</small></td>
                    <td>${course.name}<br><small>${course.area}</small></td>
                    <td>${course.credits}</td>
                    <td>${course.score.toFixed(1)}</td>
                    <td>${grade.letter}</td>
                    <td><span class="status-pill ${status.className}">${status.text}</span></td>
                </tr>
            `;
        }).join('');
    }

    function renderInsights() {
        const insightList = document.getElementById('insightList');
        if (!insightList) return;

        const courses = getFilteredCourses();
        if (!courses.length) {
            insightList.innerHTML = `
                <div class="insight-item">
                    <i class="fas fa-database"></i>
                    <div>
                        <strong>Chưa có dữ liệu điểm cá nhân</strong>
                        <p>Không dùng điểm giả để tránh gây hiểu nhầm. Trang đang chờ kết nối bảng điểm thật.</p>
                    </div>
                </div>
                <div class="insight-item success">
                    <i class="fas fa-clipboard-list"></i>
                    <div>
                        <strong>Vẫn có thể dùng thiết kế này</strong>
                        <p>Hiện có thể tra cứu quy đổi điểm, xem khung chương trình và chuẩn bị nơi hiển thị GPA/tín chỉ sau này.</p>
                    </div>
                </div>
                <div class="insight-item warning">
                    <i class="fas fa-plug-circle-bolt"></i>
                    <div>
                        <strong>Bước tiếp theo</strong>
                        <p>Khi có API/file điểm từ trường, chỉ cần đổ dữ liệu vào biến <strong>courseData</strong> hoặc thay bằng dữ liệu lấy từ server.</p>
                    </div>
                </div>
            `;
            return;
        }

        const stats = calculateStats(courses);
        const failedCourses = courses.filter(course => course.score < 5);
        const improvementCourses = courses.filter(course => course.score >= 5 && course.score < 6.5);
        const bestCourse = [...courses].sort((a, b) => b.score - a.score)[0];

        const items = [
            {
                type: 'success',
                icon: 'fa-circle-check',
                title: 'Điểm mạnh hiện tại',
                text: bestCourse ? `Môn nổi bật là ${bestCourse.name} với ${bestCourse.score.toFixed(1)} điểm. Có thể tiếp tục phát huy nhóm môn ${bestCourse.area}.` : 'Chưa có dữ liệu học phần.'
            },
            {
                type: failedCourses.length ? 'warning' : 'success',
                icon: failedCourses.length ? 'fa-triangle-exclamation' : 'fa-shield-heart',
                title: failedCourses.length ? 'Môn cần xử lý trước' : 'Không có môn rớt',
                text: failedCourses.length ? `Bạn nên ưu tiên học lại/cải thiện: ${failedCourses.map(course => course.name).join(', ')}.` : 'Các môn trong dữ liệu đang đạt yêu cầu tối thiểu.'
            },
            {
                type: stats.gpa4 >= 3.2 ? 'success' : 'default',
                icon: 'fa-bullseye',
                title: 'Mục tiêu học kỳ tới',
                text: stats.gpa4 >= 3.2 ? 'GPA đang khá tốt. Nên giữ nhóm điểm A/B+ và tránh phát sinh môn dưới 6.5.' : 'Nên đặt mục tiêu các môn trọng tâm từ 7.0 trở lên để kéo GPA hệ 4 ổn định hơn.'
            }
        ];

        insightList.innerHTML = items.map(item => `
            <div class="insight-item ${item.type}">
                <i class="fas ${item.icon}"></i>
                <div>
                    <strong>${item.title}</strong>
                    <p>${item.text}</p>
                </div>
            </div>
        `).join('');
    }

    function calculateStats(courses) {
        const attemptedCredits = courses.reduce((sum, course) => sum + course.credits, 0);
        const passedCredits = courses.reduce((sum, course) => sum + (course.score >= 5 ? course.credits : 0), 0);
        const totalWeighted10 = courses.reduce((sum, course) => sum + course.score * course.credits, 0);
        const totalWeighted4 = courses.reduce((sum, course) => sum + scoreToGrade(course.score).point4 * course.credits, 0);

        return {
            attemptedCredits,
            passedCredits,
            avg10: attemptedCredits ? totalWeighted10 / attemptedCredits : 0,
            gpa4: attemptedCredits ? totalWeighted4 / attemptedCredits : 0
        };
    }

    function scoreToGrade(score) {
        const value = Number(score);
        if (Number.isNaN(value) || value < 0 || value > 10) {
            return { letter: 'N/A', point4: 0, status: 'Điểm không hợp lệ' };
        }

        if (value >= 8.5) return { letter: 'A', point4: 4.0, status: 'Xuất sắc' };
        if (value >= 7.8) return { letter: 'B+', point4: 3.5, status: 'Tốt' };
        if (value >= 7.0) return { letter: 'B', point4: 3.0, status: 'Khá' };
        if (value >= 6.3) return { letter: 'C+', point4: 2.5, status: 'Trung bình khá' };
        if (value >= 5.5) return { letter: 'C', point4: 2.0, status: 'Trung bình' };
        if (value >= 5.0) return { letter: 'D+', point4: 1.5, status: 'Đạt thấp' };
        if (value >= 4.0) return { letter: 'D', point4: 1.0, status: 'Cần cải thiện' };
        return { letter: 'F', point4: 0, status: 'Không đạt' };
    }

    function getCourseStatus(score) {
        if (score < 5) return { text: 'Học lại', className: 'status-fail' };
        if (score < 6.5) return { text: 'Nên cải thiện', className: 'status-warning' };
        return { text: 'Đạt', className: 'status-pass' };
    }

    function getRating(gpa4) {
        if (gpa4 >= 3.6) return { title: 'Xuất sắc', note: 'Có thể đặt mục tiêu học bổng.' };
        if (gpa4 >= 3.2) return { title: 'Giỏi', note: 'Duy trì môn chuyên ngành điểm cao.' };
        if (gpa4 >= 2.5) return { title: 'Khá', note: 'Ổn, nên nâng nhóm môn dưới 6.5.' };
        if (gpa4 >= 2.0) return { title: 'Trung bình', note: 'Cần theo dõi rủi ro học vụ.' };
        return { title: 'Cảnh báo', note: 'Nên ưu tiên học lại/cải thiện.' };
    }

    function convertScore() {
        const input = document.getElementById('scoreInput');
        const result = document.getElementById('convertResult');
        if (!input || !result) return;

        const score = Number(input.value);
        if (Number.isNaN(score) || score < 0 || score > 10) {
            result.innerHTML = '<strong>Điểm chưa hợp lệ.</strong><br>Vui lòng nhập số từ 0 đến 10.';
            return;
        }

        const grade = scoreToGrade(score);
        const status = getCourseStatus(score);
        result.innerHTML = `
            <strong>${score.toFixed(1)} điểm hệ 10 = ${grade.letter}</strong><br>
            Điểm hệ 4 tương ứng: <strong>${grade.point4.toFixed(1)}</strong>.<br>
            Trạng thái gợi ý: <strong>${status.text}</strong>.
        `;
    }

    function initMiniBot() {
        const sendBtn = document.getElementById('miniSendBtn');
        const input = document.getElementById('miniInput');
        const quickPrompts = document.querySelectorAll('[data-prompt]');

        sendBtn?.addEventListener('click', executeChat);
        input?.addEventListener('keydown', event => {
            if (event.key === 'Enter') executeChat();
        });
        quickPrompts.forEach(button => {
            button.addEventListener('click', () => {
                if (input) input.value = button.dataset.prompt || '';
                executeChat();
            });
        });
    }

    function executeChat() {
        const input = document.getElementById('miniInput');
        if (!input) return;

        const text = input.value.trim();
        if (!text) return;

        addUserMessage(text);
        input.value = '';

        setTimeout(() => {
            addBotMessage(buildLocalReply(text));
        }, 350);
    }

    function addUserMessage(text) {
        const messages = document.getElementById('miniMessages');
        if (!messages) return;

        const div = document.createElement('div');
        div.className = 'user-msg';
        div.textContent = text;
        messages.appendChild(div);
        scrollMiniChatToBottom();
    }

    function addBotMessage(html) {
        const messages = document.getElementById('miniMessages');
        if (!messages) return;

        const div = document.createElement('div');
        div.className = 'bot-msg';
        div.innerHTML = html;
        messages.appendChild(div);
        scrollMiniChatToBottom();
    }

    function scrollMiniChatToBottom() {
        const chatbox = document.getElementById('miniChatbox');
        if (chatbox) chatbox.scrollTop = chatbox.scrollHeight;
    }

    function buildLocalReply(text) {
        const lower = text.toLowerCase();
        const stats = calculateStats(getFilteredCourses());
        const hasData = getFilteredCourses().length > 0;

        const scoreMatch = lower.match(/\b(10|[0-9](?:[.,][0-9])?)\b/);
        if (lower.includes('quy đổi') || lower.includes('điểm chữ') || scoreMatch) {
            const parsedScore = scoreMatch ? Number(scoreMatch[1].replace(',', '.')) : null;
            if (parsedScore !== null && parsedScore >= 0 && parsedScore <= 10) {
                const grade = scoreToGrade(parsedScore);
                return `<strong>Kết quả quy đổi:</strong><br>${parsedScore.toFixed(1)} điểm hệ 10 tương ứng <strong>${grade.letter}</strong>, hệ 4 khoảng <strong>${grade.point4.toFixed(1)}</strong>.<br><br><strong>Nhận xét:</strong><br>${grade.status}.`;
            }
        }

        if (!hasData && (lower.includes('gpa') || lower.includes('trung bình') || lower.includes('tín chỉ') || lower.includes('tc') || lower.includes('thiếu') || lower.includes('cải thiện') || lower.includes('rớt') || lower.includes('học lại'))) {
            return `<strong>Chưa có dữ liệu điểm thật.</strong><br>Hiện trang này chỉ là giao diện chuẩn bị sẵn, chưa liên kết bảng điểm từ hệ thống học vụ nên mình không tính GPA, tín chỉ hay môn cần cải thiện bằng dữ liệu giả.<br><br><strong>Bạn vẫn có thể dùng:</strong><br>- Ô quy đổi điểm hệ 10 sang điểm chữ.<br>- Khu vực khung chương trình bên dưới.<br>- Sau này kết nối dữ liệu thật thì mình sẽ phân tích tự động.`;
        }

        if (lower.includes('gpa') || lower.includes('trung bình')) {
            return `<strong>GPA hiện tại:</strong><br>GPA hệ 4 trong dữ liệu đang chọn là <strong>${stats.gpa4.toFixed(2)}</strong>, điểm trung bình hệ 10 là <strong>${stats.avg10.toFixed(2)}</strong>.`;
        }

        if (lower.includes('tín chỉ') || lower.includes('tc') || lower.includes('thiếu')) {
            return `<strong>Tín chỉ tích lũy:</strong><br>Bạn đang đạt <strong>${stats.passedCredits}/${TOTAL_PROGRAM_CREDITS}</strong> tín chỉ.`;
        }

        return `<strong>Mình đã hiểu câu hỏi.</strong><br>Trang này đang ở trạng thái <strong>chưa kết nối dữ liệu học tập thật</strong>, nên mình không tự tạo điểm hay GPA mẫu nữa.<br><br>Bạn có thể hỏi mình cách quy đổi điểm, cách tính GPA hoặc nhập một điểm như <strong>7.8 quy đổi ra gì</strong>.`;
    }

    function loadKnowledgeFile() {
        const displayBox = document.getElementById('knowledgeContent');
        if (!displayBox) return;

        fetch('/VLU-Chatbot/knowledge/khungK30.txt')
            .then(response => {
                if (!response.ok) throw new Error('Không tải được file khung chương trình.');
                return response.text();
            })
            .then(text => {
                displayBox.textContent = text || 'Chưa có dữ liệu khung chương trình.';
            })
            .catch(() => {
                displayBox.textContent = 'Chưa tải được file khung chương trình. Khi deploy, kiểm tra lại đường dẫn /VLU-Chatbot/knowledge/khungK30.txt.';
            });
    }
})();
