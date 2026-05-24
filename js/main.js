window.featurePrompts = {
    'roadmap': "Bạn là chuyên gia tư vấn lộ trình học tập tại VLU. Hãy phân tích chuyên sâu, đi thẳng vào môn học trọng tâm của từng học kỳ. Trình bày mạch lạc bằng gạch đầu dòng, loại bỏ hoàn toàn các câu chào hỏi thừa thãi.",
    'results': "Bạn là chuyên gia phân tích kết quả học tập. Hãy đọc kỹ các thông số điểm, giải thích quy chế tính GPA thang 4 và thang 10 của VLU một cách dứt khoát, ngắn gọn, dễ hiểu nhất. Tập trung vào giải pháp cải thiện điểm.",
    'graduation': "Bạn là cố vấn xét tốt nghiệp. Hãy nêu rõ các điều kiện cốt lõi (tín chỉ, chứng chỉ ngoại ngữ/tin học, học phần bắt buộc) một cách mạch lạc, phân tích trực diện vào câu hỏi, không nói dòng vo.",
    'future': "Bạn là chuyên gia định hướng nghề nghiệp thuộc Khoa CNTT - VLU. Hãy phân tích xu hướng thị trường, đưa ra lời khuyên thực tế, dứt khoát về các vị trí việc làm (Frontend, Backend, Data, AI...) phù hợp với câu hỏi.",
    'default': "Bạn là một AI Core trợ lý ảo cao cấp. Hãy thực hiện chính xác các quy tắc tư duy sau:\n1. DỊCH THUẬT TUYỆT ĐỐI: Khi người dùng yêu cầu dịch (bất kể ngôn ngữ nào: Anh, Nhật, Hàn, Trung...), hãy đóng vai biên dịch viên chuyên nghiệp. Dịch sát nghĩa, chuẩn ngữ cảnh, giữ nguyên và dịch đúng các thuật ngữ chuyên ngành (đặc biệt là CNTT/Kỹ thuật phần mềm), tuyệt đối không dịch thô word-by-word.\n2. TƯ DUY TRỌNG TÂM: Với mọi câu hỏi, đưa ra câu trả lời trực diện ngay từ dòng đầu tiên. Không chào hỏi, không lặp lại câu hỏi của người dùng.\n3. CẤU TRÚC MẠCH LẠC: Chia nhỏ thông tin thành các gạch đầu dòng (-) ngắn gọn, súc tích. Đưa ra câu trả lời có giá trị thông tin cao nhất với số lượng từ tối giản nhất."
};

window.currentSystemPrompt = window.featurePrompts['default'];

document.addEventListener('DOMContentLoaded', () => {
    console.log("%c🚀 VLU AI Core: Booting...", "color: #ff9900; font-weight: bold;");

    const startApp = () => {
        if (window.ui) {
            if (typeof ui.initSidebar === 'function') ui.initSidebar();
            if (typeof ui.updateDynamicGreeting === 'function') ui.updateDynamicGreeting();
            if (typeof ui.initScrollToBottom === 'function') ui.initScrollToBottom();
            if (typeof ui.renderHistory === 'function') ui.renderHistory();
            if (typeof ui.initClearHistory === 'function') ui.initClearHistory();
        }

        if (window.vluAuthState && typeof window.vluAuthState.init === 'function') window.vluAuthState.init();
        if (window.vluAuthUtils && typeof window.vluAuthUtils.init === 'function') window.vluAuthUtils.init();
        if (window.vluRegister && typeof window.vluRegister.init === 'function') window.vluRegister.init();

        if (window.vluLogin) {
            if (typeof window.vluLogin.initTabs === 'function') window.vluLogin.initTabs();
            if (typeof window.vluLogin.initLoginFormSubmit === 'function') window.vluLogin.initLoginFormSubmit();
        }

        const loginTabBtn = document.getElementById('loginTabBtn');
        const registerTabBtn = document.getElementById('registerTabBtn');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginTabBtn && registerTabBtn && loginForm && registerForm) {
            registerTabBtn.onclick = () => {
                loginTabBtn.classList.remove('active');
                registerTabBtn.classList.add('active');
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
            };
            loginTabBtn.onclick = () => {
                registerTabBtn.classList.remove('active');
                loginTabBtn.classList.add('active');
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
            };
        }

        if (window.upload) {
            if (typeof upload.initFilePreview === 'function') upload.initFilePreview();
            if (typeof upload.initDragAndDrop === 'function') upload.initDragAndDrop();
            console.log("✅ Module Upload & Drag-Drop: Connected");
        } else {
            setTimeout(startApp, 300);
            return;
        }

        if (window.featureMenu && typeof window.featureMenu.init === 'function') window.featureMenu.init();
        if (window.featureTheme && typeof window.featureTheme.init === 'function') window.featureTheme.init();
        if (window.featureHelp && typeof window.featureHelp.init === 'function') window.featureHelp.init();
        if (window.featureSetting && typeof window.featureSetting.init === 'function') window.featureSetting.init();

        if (window.ui && typeof window.ui.renderHistory === "function") {
            window.ui.renderHistory();
        }

        const singleToggleBtn = document.getElementById('headerToggle');
        const sidebarElement = document.querySelector('.vlu-sidebar');

        if (singleToggleBtn && sidebarElement) {
            singleToggleBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                sidebarElement.classList.toggle('collapsed');
                sidebarElement.classList.toggle('closed');
            };
        }

        const dropdownTrigger = document.getElementById('headerDropdownTrigger');
        const dropdownMenu = document.getElementById('headerDropdownMenu');
        const headerHelp = document.getElementById('headerHelpBtn');
        const headerSetting = document.getElementById('headerSettingBtn');

        if (dropdownTrigger && dropdownMenu) {
            dropdownTrigger.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isHidden = dropdownMenu.style.display === 'none' || dropdownMenu.style.display === '';
                dropdownMenu.style.display = isHidden ? 'block' : 'none';
            };

            document.addEventListener('click', () => {
                dropdownMenu.style.display = 'none';
            });

            if (headerHelp) {
                headerHelp.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropdownMenu.style.display = 'none';
                };
            }

            if (headerSetting) {
                headerSetting.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropdownMenu.style.display = 'none';
                };
            }
        }

        const personalMenuTrigger = document.getElementById('personalMenuTrigger');
        if (personalMenuTrigger) {
            personalMenuTrigger.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                personalMenuTrigger.classList.toggle('active');
            };
        }

        const footerHelpBtn = document.getElementById('helpBtn');
        const footerSettingsBtn = document.getElementById('settingsBtn');
        const helpModal = document.getElementById('helpModal');
        const authModal = document.getElementById('authModal');
        const closeHelpModalBtn = document.getElementById('closeHelpModalBtn');
        const closeAuthModalBtn = document.querySelector('.close-modal');

        if (footerHelpBtn && helpModal) {
            footerHelpBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                helpModal.style.display = 'block';
                helpModal.classList.add('show');
            };
        }

        if (closeHelpModalBtn && helpModal) {
            closeHelpModalBtn.onclick = (e) => {
                e.preventDefault();
                helpModal.style.display = 'none';
                helpModal.classList.remove('show');
            };
        }

        if (footerSettingsBtn && authModal) {
            footerSettingsBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                authModal.style.display = 'block';
                authModal.classList.add('show');
            };
        }

        if (closeAuthModalBtn && authModal) {
            closeAuthModalBtn.onclick = (e) => {
                e.preventDefault();
                authModal.style.display = 'none';
                authModal.classList.remove('show');
            };
        }

        window.addEventListener('click', (event) => {
            if (event.target === helpModal) {
                helpModal.style.display = 'none';
                helpModal.classList.remove('show');
            }
            if (event.target === authModal) {
                authModal.style.display = 'none';
                authModal.classList.remove('show');
            }
        });
    };

    startApp();

    const uiElements = {
        input: document.getElementById('userInput'),
        sendBtn: document.getElementById('sendBtn'),
        micBtn: document.querySelector('.mic-btn'),
        logoHomeBtn: document.getElementById('logoHomeBtn'),
        helpBtn: document.getElementById('headerHelpBtn')
    };

    const handleSend = () => {
        const sendFunc = window.sendMessage || (window.chat && window.chat.sendMessage);
        if (typeof sendFunc === 'function') {
            sendFunc();
        } else {
            console.error("❌ sendMessage() not found in chat.js");
        }
    };

    if (uiElements.logoHomeBtn) {
        uiElements.logoHomeBtn.onclick = (e) => {
            e.preventDefault();
            window.currentChatId = null;
            window.currentSystemPrompt = window.featurePrompts['default'];
            const messagesContainer = document.getElementById('messagesContainer');
            if (messagesContainer) messagesContainer.innerHTML = '';
            const welcomeScreen = document.getElementById('welcomeScreen');
            if (welcomeScreen) welcomeScreen.classList.remove('hidden');
            if (uiElements.input) {
                uiElements.input.value = '';
                uiElements.input.style.height = 'auto';
                uiElements.input.focus();
            }
            if (window.ui && typeof window.ui.renderHistory === 'function') {
                window.ui.renderHistory();
            }
        };
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (uiElements.micBtn && SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        uiElements.micBtn.onclick = (e) => {
            e.preventDefault();
            recognition.start();
            uiElements.micBtn.classList.add('recording');
            uiElements.micBtn.style.color = "red";
        };
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (uiElements.input) {
                uiElements.input.value = transcript;
                handleSend();
            }
            uiElements.micBtn.classList.remove('recording');
            uiElements.micBtn.style.color = "";
        };
        recognition.onerror = () => {
            uiElements.micBtn.classList.remove('recording');
            uiElements.micBtn.style.color = "";
        };
    }

    if (uiElements.input) {
        uiElements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
        uiElements.input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 180) + 'px';
        });
        uiElements.input.focus();
    }

    if (uiElements.sendBtn) {
        uiElements.sendBtn.onclick = (e) => {
            e.preventDefault();
            handleSend();
        };
    }

    console.log("%c🏁 VLU AI Core: Ready to chat!", "color: #00ff00; font-weight: bold;");
});

window.copyText = (el) => {
    const textWrapper = el.closest('.message-wrapper') || el.closest('.bot-message');
    if (!textWrapper) return;
    const text = textWrapper.querySelector('.content').innerText;
    navigator.clipboard.writeText(text).then(() => {
        const originalIcon = el.className;
        el.className = "fas fa-check";
        setTimeout(() => el.className = originalIcon, 2000);
    });
};

window.speakText = (el) => {
    const textWrapper = el.closest('.message-wrapper') || el.closest('.bot-message');
    if (!textWrapper) return;
    const text = textWrapper.querySelector('.content').innerText;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    window.speechSynthesis.speak(utterance);
};