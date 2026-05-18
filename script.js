// // --- 1. CẤU HÌNH GROQ API ---
// let API_KEY = "";
// if (typeof CONFIG !== "undefined") {
//     API_KEY = CONFIG.GROQ_API_KEY;
// } else {
//     console.warn("Đang chạy chế độ Demo (không có API Key). Giao diện vẫn hoạt động bình thường.");
// }

// const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// // Biến toàn cục để quản lý phiên chat và ngữ cảnh
// let currentChatId = null;
// let currentSystemPrompt = "Bạn là trợ lý ảo của Đại học Văn Lang (VLU). Hãy trả lời thân thiện bằng tiếng Việt.";

// // Định nghĩa các ngữ cảnh chuyên biệt cho từng mục sidebar
// const featurePrompts = {
//     'roadmap': "Bạn là chuyên gia tư vấn lộ trình học tập tại VLU. Hãy dựa vào chương trình đào tạo của trường để tư vấn các môn học, chứng chỉ (như IELTS 7.5) và lộ trình ra trường đúng hạn cho sinh viên.",
//     'results': "Bạn là chuyên gia phân tích kết quả học tập. Hãy giúp sinh viên hiểu về GPA, cách cải thiện điểm số và các quy định về học vụ tại VLU.",
//     'graduation': "Bạn là cố vấn tốt nghiệp. Hãy tư vấn về điều kiện xét tốt nghiệp, các chứng chỉ đầu ra và thủ tục nhận bằng tại VLU.",
//     'future': "Bạn là chuyên gia định hướng nghề nghiệp. Hãy giúp sinh viên VLU kết nối ngành học với thị trường lao động và phát triển kỹ năng mềm.",
//     'default': "Bạn là trợ lý ảo của Đại học Văn Lang (VLU). Hãy trả lời thân thiện bằng tiếng Việt."
// };

// document.addEventListener('DOMContentLoaded', () => {
//     // --- 2. KHAI BÁO CÁC PHẦN TỬ ---
//     const modal = document.getElementById('authModal');
//     const guestBtn = document.getElementById('guestBtn');
//     const closeBtn = document.querySelector('.close-modal');
//     const loginTabBtn = document.getElementById('loginTabBtn');
//     const registerTabBtn = document.getElementById('registerTabBtn');
//     const loginForm = document.getElementById('loginForm');
//     const registerForm = document.getElementById('registerForm');
//     const userInput = document.getElementById('userInput');
//     const chatbox = document.getElementById('chatbox');
//     const welcomeScreen = document.getElementById('welcomeScreen');
//     const plusBtn = document.getElementById('plusBtn');
//     const attachMenu = document.getElementById('attachMenu');
//     const sendBtn = document.getElementById('sendBtn');
//     const clearChatBtn = document.getElementById('clearChatBtn');
//     const chatHistoryList = document.getElementById('chatHistoryList');
//     const newChatBtn = document.getElementById('newChatBtn');
//     const darkModeBtn = document.getElementById('darkModeBtn');
//     const modeText = document.getElementById('modeText');
//     const messagesContainer = document.getElementById('messagesContainer');
//     const toggleSidebar = document.getElementById('toggleSidebar');
//     const sidebar = document.querySelector('aside');
//     const goHomeBtn = document.getElementById('goHomeBtn');

//     // Các phần tử cho tính năng đính kèm mới
//     const hasSubmenu = document.querySelector('.has-submenu');
//     const submenu = document.querySelector('.submenu');
//     const hiddenFileInput = document.getElementById('hiddenFileInput');

//     // Các phần tử cho tính năng xem trước ảnh (PREVIEW TRONG THANH CHAT)
//     const imagePreviewContainer = document.getElementById('imagePreviewContainer');
//     const imagePreview = document.getElementById('imagePreview');
//     const closePreview = document.getElementById('closePreview');

//     if (goHomeBtn) {
//         goHomeBtn.addEventListener('click', (e) => {
//             e.preventDefault();
//             currentChatId = null;
//             currentSystemPrompt = featurePrompts['default'];
//             messagesContainer.innerHTML = '';
//             if (welcomeScreen) welcomeScreen.classList.remove('hidden');
//             userInput.value = '';
//             userInput.style.height = 'auto';
//             userInput.focus();
//             const historyItems = document.querySelectorAll('.history-item');
//             historyItems.forEach(item => item.classList.remove('active'));
//         });
//     }

//     // --- LOGIC ĐÓNG/MỞ SIDEBAR ---
//     if (toggleSidebar && sidebar) {
//         toggleSidebar.onclick = () => {
//             sidebar.classList.toggle('closed');
//             const icon = toggleSidebar.querySelector('i');
//             if (sidebar.classList.contains('closed')) {
//                 icon.classList.replace('fa-bars', 'fa-chevron-right');
//             } else {
//                 icon.classList.replace('fa-chevron-right', 'fa-bars');
//             }
//         };
//     }

//     // --- 2.1 LOGIC ĐIỀU KHIỂN MENU ĐÍNH KÈM (CLICK ĐỂ ĐỨNG IM) ---
//     if (plusBtn && attachMenu) {
//         plusBtn.onclick = (e) => {
//             e.stopPropagation();
//             const isMenuOpen = attachMenu.style.display === 'block';
//             attachMenu.style.display = isMenuOpen ? 'none' : 'block';
//             attachMenu.classList.toggle('active');
//             if (isMenuOpen && submenu) submenu.style.display = 'none';
//         };

//         const menuItems = attachMenu.querySelectorAll('.menu-item');
//         menuItems.forEach(item => {
//             item.onclick = function(e) {
//                 e.stopPropagation();
//                 const action = this.innerText.trim();

//                 switch (action) {
//                     case "Thêm ảnh và tệp":
//                         if (hiddenFileInput) hiddenFileInput.click();
//                         break;
//                     case "Tạo hình ảnh":
//                         userInput.value = "/imagine ";
//                         userInput.focus();
//                         break;
//                     case "Thêm": // Mục có menu con
//                         if (submenu) {
//                             const isShow = submenu.style.display === 'block';
//                             submenu.style.display = isShow ? 'none' : 'block';
//                         }
//                         return; // Không đóng menu chính khi nhấn vào "Thêm"
//                     case "Tìm kiếm trên mạng":
//                         alert("Đang kích hoạt tìm kiếm trực tuyến!");
//                         break;
//                 }
//                 // Đóng menu khi chọn các tính năng khác
//                 attachMenu.style.display = 'none';
//                 attachMenu.classList.remove('active');
//                 if (submenu) submenu.style.display = 'none';
//             };
//         });
//     }

//     // Nhấn ra ngoài để đóng menu
//     document.addEventListener('click', (e) => {
//         if (attachMenu && !attachMenu.contains(e.target) && e.target !== plusBtn) {
//             attachMenu.classList.remove('active');
//             attachMenu.style.display = 'none';
//             if (submenu) submenu.style.display = 'none';
//         }
//     });

//     // --- XỬ LÝ KHI CHỌN FILE (XEM TRƯỚC TRONG THANH CHAT) ---
//     if (hiddenFileInput) {
//         hiddenFileInput.onchange = (event) => {
//             const file = event.target.files[0];
//             if (file && file.type.startsWith('image/')) {
//                 const reader = new FileReader();
//                 reader.onload = (e) => {
//                     if (imagePreview) imagePreview.src = e.target.result;
//                     if (imagePreviewContainer) imagePreviewContainer.style.display = 'block';
//                 };
//                 reader.readAsDataURL(file);
//             } else if (file) {
//                 renderBotMessage(`📁 **Đã nhận tệp:** \`${file.name}\`. (Hệ thống chưa hỗ trợ xem trước tệp tin)`, true);
//             }
//             hiddenFileInput.value = '';
//         };
//     }

//     if (closePreview) {
//         closePreview.onclick = (e) => {
//             e.stopPropagation();
//             if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
//             if (imagePreview) imagePreview.src = '';
//         };
//     }

//     // --- 2.2 LOGIC CHUYỂN ĐỔI PHIÊN CHAT THEO TÍNH NĂNG ---
//     function switchToFeatureChat(featureKey) {
//         currentChatId = null;
//         messagesContainer.innerHTML = '';
//         if (welcomeScreen) welcomeScreen.classList.add('hidden');
//         currentSystemPrompt = featurePrompts[featureKey] || featurePrompts['default'];

//         let introText = "Chào bạn! Mình có thể giúp gì cho bạn?";
//         if (featureKey === 'roadmap') introText = "Chào bạn! Mình sẽ giúp bạn xây dựng **lộ trình học tập** hiệu quả tại VLU.";
//         else if (featureKey === 'results') introText = "Chào bạn! Hãy gửi bảng điểm cho mình, mình sẽ **phân tích kết quả** giúp bạn.";
//         else if (featureKey === 'graduation') introText = "Chào bạn! Mình hỗ trợ kiểm tra điều kiện để **tốt nghiệp** đúng hạn.";
//         else if (featureKey === 'future') introText = "Chào bạn! Chúng ta thảo luận về **định hướng sự nghiệp** nhé.";

//         renderBotMessage(introText, true);
//         userInput.focus();
//         updateHistorySidebar();
//     }

//     // Gán sự kiện cho các nút tính năng
//     ['roadmap', 'results', 'graduation', 'future'].forEach(key => {
//         const btn = document.getElementById(`btn-${key}`);
//         if (btn) btn.onclick = (e) => {
//             e.preventDefault();
//             switchToFeatureChat(key);
//         };
//     });

//     // --- 3. TỰ ĐỘNG LOAD DANH SÁCH SIDEBAR ---
//     updateHistorySidebar();

//     // --- LOGIC LỜI CHÀO THEO BUỔI ---
//     const dynamicGreeting = document.getElementById('dynamicGreeting');
//     const hour = new Date().getHours();
//     if (dynamicGreeting) {
//         if (hour < 12) dynamicGreeting.innerText = "Chào buổi sáng! Chúc bạn ngày mới năng suất tại VLU! ☀️";
//         else if (hour < 18) dynamicGreeting.innerText = "Buổi chiều tốt lành! Bạn đã nộp bài tập chưa đó? 📝";
//         else dynamicGreeting.innerText = "Tối muộn rồi, đừng thức khuya quá nhé sinh viên VLU ơi! 🌙";
//     }

//     // --- 4. XỬ LÝ ĐOẠN CHAT MỚI ---
//     if (newChatBtn) {
//         newChatBtn.onclick = () => {
//             currentChatId = null;
//             currentSystemPrompt = featurePrompts['default'];
//             messagesContainer.innerHTML = '';
//             if (welcomeScreen) welcomeScreen.classList.remove('hidden');
//             userInput.value = '';
//             userInput.style.height = 'auto';
//             userInput.focus();
//             document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
//         };
//     }

//     // --- 5. LOGIC LƯU VÀ TẢI LỊCH SỬ ---
//     function saveChatToLocal(role, text) {
//         if (!currentChatId) currentChatId = Date.now().toString();
//         let allChats = JSON.parse(localStorage.getItem('vlu_chat_sessions')) || {};
//         if (!allChats[currentChatId]) {
//             allChats[currentChatId] = {
//                 title: text.substring(0, 30) + (text.length > 30 ? "..." : ""),
//                 messages: [],
//                 timestamp: Date.now()
//             };
//         }
//         allChats[currentChatId].messages.push({ role, text });
//         localStorage.setItem('vlu_chat_sessions', JSON.stringify(allChats));
//         updateHistorySidebar();
//     }

//     function updateHistorySidebar() {
//         if (!chatHistoryList) return;
//         chatHistoryList.innerHTML = '';
//         const allChats = JSON.parse(localStorage.getItem('vlu_chat_sessions')) || {};
//         Object.keys(allChats).reverse().forEach(id => {
//             const historyItem = document.createElement('div');
//             historyItem.className = `history-item ${id === currentChatId ? 'active' : ''}`;
//             historyItem.innerHTML = `
//                 <div class="history-info" onclick="loadSession('${id}')">
//                     <i class="far fa-comment"></i>
//                     <span class="history-title">${allChats[id].title}</span>
//                 </div>
//                 <div class="history-actions">
//                     <i class="fas fa-trash-alt delete-btn" title="Xóa cuộc trò chuyện" onclick="deleteSpecificChat(event, '${id}')"></i>
//                 </div>`;
//             chatHistoryList.appendChild(historyItem);
//         });
//     }

//     window.loadSession = (id) => {
//         currentChatId = id;
//         renderSession(id);
//         updateHistorySidebar();
//     };

//     function renderSession(id) {
//         const allChats = JSON.parse(localStorage.getItem('vlu_chat_sessions')) || {};
//         const chatData = allChats[id];
//         if (chatData) {
//             messagesContainer.innerHTML = '';
//             if (welcomeScreen) welcomeScreen.classList.add('hidden');
//             chatData.messages.forEach(msg => {
//                 if (msg.role === 'user') renderUserMessage(msg.text);
//                 else renderBotMessage(msg.text, false);
//             });
//             chatbox.scrollTop = chatbox.scrollHeight;
//         }
//     }

//     window.deleteSpecificChat = (event, id) => {
//         if (event) event.stopPropagation();
//         if (confirm('Bạn có muốn xóa cuộc trò chuyện này không?')) {
//             let allChats = JSON.parse(localStorage.getItem('vlu_chat_sessions')) || {};
//             delete allChats[id];
//             localStorage.setItem('vlu_chat_sessions', JSON.stringify(allChats));
//             if (id === currentChatId) {
//                 currentChatId = null;
//                 messagesContainer.innerHTML = '';
//                 if (welcomeScreen) welcomeScreen.classList.remove('hidden');
//             }
//             updateHistorySidebar();
//         }
//     };

//     // --- 6. HÀM HIỂN THỊ TIN NHẮN ---
//     function renderUserMessage(text) {
//         const uMsg = document.createElement('div');
//         uMsg.className = "message user-message";
//         uMsg.innerHTML = `<div class="content">${text}</div>`;
//         messagesContainer.appendChild(uMsg);
//         chatbox.scrollTop = chatbox.scrollHeight;
//     }

//     function renderUserImageMessage(url, fileName) {
//         const uMsg = document.createElement('div');
//         uMsg.className = "message user-message fade-in";
//         uMsg.innerHTML = `
//         <div class="content" style="padding: 10px; max-width: 70%;">
//             <div style="display: flex; flex-direction: column; align-items: flex-end;">
//                 <img src="${url}" alt="${fileName}" style="width: 100%; max-width: 300px; border-radius: 8px; display: block;">
//                 <p style="font-size: 11px; margin-top: 5px; opacity: 0.7; word-break: break-all;">${fileName}</p>
//             </div>
//         </div>
//     `;
//         if (messagesContainer) {
//             messagesContainer.appendChild(uMsg);
//             chatbox.scrollTop = chatbox.scrollHeight;
//         }
//     }

//     function renderBotMessage(text, isNew = true) {
//         const bMsg = document.createElement('div');
//         bMsg.className = "message bot-message";
//         bMsg.innerHTML = `
//             <div class="bot-icon"><i class="fas fa-robot"></i></div>
//             <div class="message-wrapper" style="max-width: 85%;">
//                 <div class="content"></div>
//                 <div class="bot-actions">
//                     <i class="far fa-copy" title="Sao chép" onclick="copyText(this)"></i>
//                     <i class="fas fa-volume-up" title="Phát âm thanh" onclick="speakText(this)"></i>
//                 </div>
//             </div>`;
//         messagesContainer.appendChild(bMsg);
//         const contentDiv = bMsg.querySelector('.content');
//         if (text.trim().startsWith('<div')) {
//             contentDiv.innerHTML = text;
//         } else {
//             const htmlContent = typeof marked !== 'undefined' ? marked.parse(text) : text;
//             contentDiv.innerHTML = htmlContent;
//         }
//         if (isNew) contentDiv.classList.add('fade-in');
//         chatbox.scrollTop = chatbox.scrollHeight;
//     }

//     // --- 7. XỬ LÝ GỬI TIN NHẮN QUA GROQ API ---
//     async function sendMessage() {
//         const text = userInput.value.trim();
//         const hasImage = imagePreviewContainer && imagePreviewContainer.style.display === 'block';

//         if (!text && !hasImage) return;

//         if (welcomeScreen) welcomeScreen.classList.add('hidden');

//         // Gửi ảnh trước nếu có
//         if (hasImage) {
//             renderUserImageMessage(imagePreview.src, "Ảnh đính kèm");
//             imagePreviewContainer.style.display = 'none';
//             imagePreview.src = '';
//         }

//         // Gửi text sau
//         if (text) {
//             renderUserMessage(text);
//             saveChatToLocal('user', text);
//         }

//         userInput.value = '';
//         userInput.style.height = 'auto';

//         const typingMsg = document.createElement('div');
//         typingMsg.className = "message bot-message typing-indicator";
//         typingMsg.innerHTML = `<div class="bot-icon"><i class="fas fa-robot"></i></div><div class="content"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
//         messagesContainer.appendChild(typingMsg);
//         chatbox.scrollTop = chatbox.scrollHeight;

//         if (!API_KEY) {
//             setTimeout(() => {
//                 if (messagesContainer.contains(typingMsg)) messagesContainer.removeChild(typingMsg);
//                 renderBotMessage("⚠️ Vui lòng cấu hình **GROQ_API_KEY** trong file `config.js` để bắt đầu.", true);
//             }, 800);
//             return;
//         }

//         try {
//             const response = await fetch(GROQ_URL, {
//                 method: "POST",
//                 headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     model: "llama-3.3-70b-versatile",
//                     messages: [{ role: "system", content: currentSystemPrompt }, { role: "user", content: text }]
//                 })
//             });
//             const data = await response.json();
//             if (messagesContainer.contains(typingMsg)) messagesContainer.removeChild(typingMsg);
//             const botResponse = data.choices[0].message.content;
//             renderBotMessage(botResponse, true);
//             saveChatToLocal('bot', botResponse);
//         } catch (error) {
//             if (messagesContainer.contains(typingMsg)) messagesContainer.removeChild(typingMsg);
//             renderBotMessage("Ối! Có lỗi kết nối rồi bạn ơi.", true);
//         }
//     }

//     // --- SỰ KIỆN NÚT BẤM ---
//     userInput.onkeydown = (e) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             sendMessage();
//         }
//     };
//     sendBtn.onclick = sendMessage;

//     if (darkModeBtn) {
//         darkModeBtn.onclick = () => {
//             const isDark = document.body.classList.toggle('dark-mode');
//             localStorage.setItem('theme', isDark ? 'dark' : 'light');
//             const icon = darkModeBtn.querySelector('i');
//             if (isDark) {
//                 if (icon) icon.classList.replace('fa-moon', 'fa-sun');
//                 if (modeText) modeText.innerText = "Chế độ sáng";
//             } else {
//                 if (icon) icon.classList.replace('fa-sun', 'fa-moon');
//                 if (modeText) modeText.innerText = "Chế độ tối";
//             }
//         };
//     }

//     window.copyText = (el) => {
//         const text = el.closest('.message-wrapper').querySelector('.content').innerText;
//         navigator.clipboard.writeText(text);
//         el.className = "fas fa-check";
//         el.style.color = "#28a745";
//         setTimeout(() => {
//             el.className = "far fa-copy";
//             el.style.color = "";
//         }, 2000);
//     };

//     window.speakText = (el) => {
//         const text = el.closest('.message-wrapper').querySelector('.content').innerText;
//         const utterance = new SpeechSynthesisUtterance(text);
//         utterance.lang = 'vi-VN';
//         window.speechSynthesis.speak(utterance);
//     };

//     userInput.oninput = function() {
//         this.style.height = 'auto';
//         this.style.height = (this.scrollHeight) + 'px';
//     };
//     window.useSuggestion = (text) => {
//         userInput.value = text;
//         userInput.dispatchEvent(new Event('input'));
//         sendMessage();
//     };
// });

// // --- 8. KÍCH HOẠT CÁC NÚT TÍNH NĂNG PHỤ ---
// const helpBtn = document.querySelector('.sidebar-bottom .icon-link:nth-child(1)');
// if (helpBtn) helpBtn.onclick = () => renderBotMessage("Chào bạn! Mình là trợ lý ảo VLU. Bạn có thể hỏi mình về quy chế, GPA hay lộ trình học tập.", true);

// const micBtn = document.querySelector('.mic-btn');
// if (micBtn) {
//     micBtn.onclick = () => {
//         const recognition = new(window.SpeechRecognition || window.webkitSpeechRecognition)();
//         recognition.lang = 'vi-VN';
//         micBtn.style.color = 'var(--vlu-red)';
//         recognition.start();
//         recognition.onresult = (event) => {
//             userInput.value = event.results[0][0].transcript;
//             userInput.dispatchEvent(new Event('input'));
//             micBtn.style.color = '';
//         };
//         recognition.onerror = () => {
//             micBtn.style.color = '';
//             alert("Không thể nhận diện giọng nói!");
//         };
//     };
// }

// const scrollToBottomBtn = document.getElementById('scrollToBottom');
// if (scrollToBottomBtn) {
//     // Đảm bảo chatbox tồn tại
//     const chatbox = document.getElementById('chatbox');
//     if (chatbox) {
//         chatbox.onscroll = () => {
//             scrollToBottomBtn.style.display = (chatbox.scrollTop < chatbox.scrollHeight - chatbox.clientHeight - 100) ? 'flex' : 'none';
//         };
//         scrollToBottomBtn.onclick = () => chatbox.scrollTo({ top: chatbox.scrollHeight, behavior: 'smooth' });
//     }
// }

// // Xử lý Modal Đăng nhập
// const authModal = document.getElementById('authModal');
// const guestBtn = document.getElementById('guestBtn');
// const closeModal = document.querySelector('.close-modal');
// if (guestBtn) guestBtn.onclick = () => authModal.style.display = 'block';
// if (closeModal) closeModal.onclick = () => authModal.style.display = 'none';
// window.onclick = (event) => {
//     if (event.target == authModal) authModal.style.display = 'none';
// };