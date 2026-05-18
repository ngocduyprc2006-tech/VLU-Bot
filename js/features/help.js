/** * FILE: js/features/help.js
 * CHỨC NĂNG: Xử lý nút Trợ giúp hiển thị cẩm nang hướng dẫn sử dụng Chatbot
 */

window.featureHelp = {
    init: function() {
        const helpBtn = document.getElementById('helpBtn');
        if (!helpBtn) return;

        helpBtn.onclick = (e) => {
            e.preventDefault();
            alert("💡 HƯỚNG DẪN SỬ DỤNG VLU CHATBOT:\n\n" +
                "1. Bấm trực tiếp vào LOGO trường Văn Lang để làm mới cuộc hội thoại và quay về trang chủ ban đầu.\n" +
                "2. Chọn các tính năng (Lộ trình cá nhân, Kết quả học tập...) để kích hoạt trợ lý chuyên gia chuyên sâu.\n" +
                "3. Bạn có thể xóa riêng lẻ từng phiên chat cũ bằng cách bấm vào biểu tượng Thùng rác nhỏ ngay cạnh dòng lịch sử.");
        };
    }
};