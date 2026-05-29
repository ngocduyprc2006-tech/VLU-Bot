window.lastUploadedDocContent = "";

// Add a preview thumbnail for an image URL
function addImagePreview(url, fileName) {
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewList = document.getElementById('previewList');
    if (!previewList || !previewContainer) return;

    const item = document.createElement('div');
    item.className = 'preview-item';
    item.innerHTML = `
        <img src="${url}" alt="${fileName}">
        <button type="button" class="preview-close" title="Xóa hình">×</button>
    `;

    // close handler for this thumbnail
    const closeBtn = item.querySelector('.preview-close');
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        item.remove();
        // if no previews left, hide container
        if (previewList.children.length === 0) previewContainer.style.display = 'none';
    };

    previewList.appendChild(item);
    previewContainer.style.display = 'block';
    previewContainer.classList.add('bounce-in');
}

async function processFile(file) {
    if (!file) return;

    const previewContainer = document.getElementById('imagePreviewContainer');

    if (file.type && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            addImagePreview(e.target.result, file.name);
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
        hiddenFileInput.setAttribute('multiple', '');
        hiddenFileInput.onchange = (e) => {
            const files = Array.from(e.target.files || []);
            files.forEach(f => processFile(f));
            // clear value so same file can be selected again
            hiddenFileInput.value = '';
        };
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