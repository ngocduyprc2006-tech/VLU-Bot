/** * FILE: js/features/menu.js
 * CHỨC NĂNG: Điều khiển Menu (+) thông minh và các nút đính kèm mở rộng
 */

window.featureMenu = {
    init: function() {
        const plusBtn = document.getElementById('plusBtn');
        const attachMenu = document.getElementById('attachMenu');
        const hiddenFileInput = document.getElementById('hiddenFileInput');
        const submenu = document.querySelector('.submenu');

        if (!plusBtn || !attachMenu) return;

        // Bấm nút cộng để toggle menu
        plusBtn.onclick = (e) => {
            e.stopPropagation();
            const isOpen = attachMenu.classList.toggle('active');
            attachMenu.style.display = isOpen ? 'block' : 'none';
            if (!isOpen && submenu) submenu.style.display = 'none';
        };

        // Bắt sự kiện click chuột cho từng ô lựa chọn bên trong Menu
        attachMenu.querySelectorAll('.menu-item').forEach(item => {
            item.onclick = function(e) {
                e.stopPropagation();
                const action = this.innerText.trim();

                // 1. Nhóm nút đính kèm ảnh và tệp
                if (action.includes("ảnh và tệp")) {
                    if (hiddenFileInput) hiddenFileInput.click();
                }
                // 2. Nhóm nút Tạo hình ảnh AI
                else if (action.includes("Tạo hình ảnh")) {
                    if (window.featureImageGen && typeof window.featureImageGen.init === 'function') {
                        window.featureImageGen.init();
                    }
                }
                // 3. Nhóm nút Đang suy nghĩ
                else if (action.includes("Đang suy nghĩ")) {
                    if (window.featureReasoning && typeof window.featureReasoning.activate === 'function') {
                        window.featureReasoning.activate(false);
                    }
                }
                // 4. Nhóm nút Nghiên cứu chuyên sâu
                else if (action.includes("Nghiên cứu chuyên sâu")) {
                    if (window.featureReasoning && typeof window.featureReasoning.activate === 'function') {
                        window.featureReasoning.activate(true);
                    }
                }
                // 5. Nhóm nút Tìm kiếm trên mạng
                else if (action.includes("Tìm kiếm trên mạng")) {
                    if (window.featureSearch && typeof window.featureSearch.init === 'function') {
                        window.featureSearch.init();
                    }
                }
                // 6. Nhóm nút Học hỏi
                else if (action.includes("Học hỏi")) {
                    if (window.featureLearning && typeof window.featureLearning.init === 'function') {
                        window.featureLearning.init();
                    }
                }
                // 7. Nhóm nút Soạn thảo văn bản
                else if (action.includes("Soạn thảo văn bản")) {
                    if (window.featureWriting && typeof window.featureWriting.init === 'function') {
                        window.featureWriting.init();
                    }
                }

                window.featureMenu.closeAllMenus();
            };
        });

        // Click ra ngoài vùng menu thì tự động khép ẩn menu lại
        document.addEventListener('click', (e) => {
            if (!attachMenu.contains(e.target) && e.target !== plusBtn) {
                window.featureMenu.closeAllMenus();
            }
        });
    }, // Dấu phẩy kết thúc hàm init để chuyển sang hàm tiếp theo trong đối tượng

    // 🔹 ĐÃ ĐƯA VÀO TRONG ĐỐI TƯỢNG: Hàm đóng toàn bộ menu
    closeAllMenus: function() {
        const attachMenu = document.getElementById('attachMenu');
        const submenu = document.querySelector('.submenu');
        if (attachMenu) {
            attachMenu.style.display = 'none';
            attachMenu.classList.remove('active');
        }
        if (submenu) submenu.style.display = 'none';
    }
};