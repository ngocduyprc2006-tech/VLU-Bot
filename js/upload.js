window.lastUploadedDocContent = "";

async function processFile(file) {
    if (!file) return;

    const previewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (imagePreview) imagePreview.src = e.target.result;
            if (previewContainer) {
                previewContainer.style.display = 'block';
                previewContainer.classList.add('bounce-in');
            }
        };
        reader.readAsDataURL(file);
    } else {
        const extension = file.name.split('.').pop().toLowerCase();

        if (file.type === "text/plain" || extension === "txt") {
            window.lastUploadedDocContent = await file.text();
            showFileStatus(file.name, "Đã trích xuất nội dung chữ thành công");
        } else {
            showFileStatus(file.name, "Đã nhận file (Cần thư viện bổ trợ để đọc định dạng này)");
        }
    }
}

function showFileStatus(fileName, status) {
    if (typeof window.renderBotMessage === 'function') {
        window.renderBotMessage(`📁 **File đính kèm:** \`${fileName}\`\n*${status}*`);
    }
}

function initDragAndDrop() {
    const dropZone = document.body;
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
        dropZone.addEventListener(name, e => e.preventDefault());
    });

    dropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        processFile(file);
    });
}

function initFilePreview() {
    const hiddenFileInput = document.getElementById('hiddenFileInput');
    const closePreview = document.getElementById('closePreview');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');

    if (hiddenFileInput) {
        hiddenFileInput.onchange = (e) => processFile(e.target.files[0]);
    }

    if (closePreview) {
        closePreview.onclick = (e) => {
            e.stopPropagation();
            if (previewContainer) previewContainer.style.display = 'none';
            if (imagePreview) imagePreview.src = '';
            window.lastUploadedDocContent = "";
        };
    }
}

window.upload = {
    initFilePreview,
    initDragAndDrop,
    processExternalFile: processFile
};