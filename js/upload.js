/** * FILE: js/upload.js
 * CHỨC NĂNG: Xử lý Menu thông minh, Kéo thả & Đọc đa định dạng (Ảnh + Tài liệu)
 */

const ui = {
    plusBtn: document.getElementById('plusBtn'),
    attachMenu: document.getElementById('attachMenu'),
    hiddenFileInput: document.getElementById('hiddenFileInput'),
    previewContainer: document.getElementById('imagePreviewContainer'),
    imagePreview: document.getElementById('imagePreview'),
    closePreview: document.getElementById('closePreview'),
    submenu: document.querySelector('.submenu'),
    chatBox: document.getElementById('chatbox') // Để xử lý kéo thả vào đây
};

// --- 1. ĐIỀU KHIỂN MENU (+) ---
function initAttachMenu() {
    if (!ui.plusBtn || !ui.attachMenu) return;

    ui.plusBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = ui.attachMenu.classList.toggle('active');
        ui.attachMenu.style.display = isOpen ? 'block' : 'none';
        if (!isOpen && ui.submenu) ui.submenu.style.display = 'none';
    };

    ui.attachMenu.querySelectorAll('.menu-item').forEach(item => {
        item.onclick = function(e) {
            e.stopPropagation();
            const action = this.innerText.trim();

            if (action.includes("ảnh và tệp")) ui.hiddenFileInput.click();
            else if (action.includes("Tạo hình ảnh")) {
                const input = document.getElementById('userInput');
                input.value = "/imagine ";
                input.focus();
            }
            // Đóng menu sau khi chọn
            closeAllMenus();
        };
    });

    document.addEventListener('click', (e) => {
        if (!ui.attachMenu.contains(e.target) && e.target !== ui.plusBtn) closeAllMenus();
    });
}

function closeAllMenus() {
    ui.attachMenu.style.display = 'none';
    ui.attachMenu.classList.remove('active');
    if (ui.submenu) ui.submenu.style.display = 'none';
}

// --- 2. XỬ LÝ FILE (ẢNH & TÀI LIỆU) ---
async function processFile(file) {
    if (!file) return;

    // A. Xử lý Hình ảnh
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            ui.imagePreview.src = e.target.result;
            ui.previewContainer.style.display = 'block';
            // Tạo hiệu ứng highlight cho khung preview
            ui.previewContainer.classList.add('bounce-in');
        };
        reader.readAsDataURL(file);
    }
    // B. Xử lý Tài liệu (TXT, PDF, Word...)
    else {
        const extension = file.name.split('.').pop().toLowerCase();

        // Đọc nội dung nếu là file text đơn giản
        if (file.type === "text/plain" || extension === "txt") {
            window.lastUploadedDocContent = await file.text();
            showFileStatus(file.name, "Đã trích xuất nội dung chữ");
        }
        // Với PDF/Word cần thư viện (Duy có thể nâng cấp sau), hiện tại báo nhận file
        else {
            showFileStatus(file.name, "Đã nhận file (Cần thư viện để đọc nội dung)");
        }
    }
}

// Hàm hiển thị trạng thái file nhỏ dưới thanh chat (như Gemini)
function showFileStatus(fileName, status) {
    if (typeof renderBotMessage === 'function') {
        renderBotMessage(`📁 **File đính kèm:** \`${fileName}\`\n*${status}*`);
    }
}

// --- 3. KÉO THẢ FILE (TREND HIỆN ĐẠI) ---
function initDragAndDrop() {
    const dropZone = document.body; // Kéo vào đâu cũng nhận

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
        dropZone.addEventListener(name, e => e.preventDefault());
    });

    dropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        processFile(file);
    });
}

function initFilePreview() {
    if (ui.hiddenFileInput) {
        ui.hiddenFileInput.onchange = (e) => processFile(e.target.files[0]);
    }

    if (ui.closePreview) {
        ui.closePreview.onclick = (e) => {
            e.stopPropagation();
            ui.previewContainer.style.display = 'none';
            ui.imagePreview.src = '';
            window.lastUploadedDocContent = ""; // Xóa dữ liệu cũ
        };
    }
}

// Xuất module
window.upload = { initAttachMenu, initFilePreview, initDragAndDrop };