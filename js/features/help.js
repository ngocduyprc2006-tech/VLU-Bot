/** * FILE: js/features/help.js
 * CHỨC NĂNG: Xử lý nút Trợ giúp hiển thị cẩm nang hướng dẫn sử dụng Chatbot
 */

window.featureHelp = {
    init: function() {
        const helpBtn = document.getElementById('headerHelpBtn');
        const helpModal = document.getElementById('helpModal');
        const closeHelpModalBtn = document.getElementById('closeHelpModalBtn');

        if (!helpBtn || !helpModal) return;

        helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            helpModal.style.display = 'flex';
        });

        if (closeHelpModalBtn) {
            closeHelpModalBtn.onclick = () => {
                helpModal.style.display = 'none';
            };
        }

        window.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });
    }
};