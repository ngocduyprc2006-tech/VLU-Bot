/** * FILE: js/auth/login.js
 * CHỨC NĂNG: Xử lý Form đăng nhập thủ công, liên kết Google và Facebook Auth Popup (Không chặn đuôi mail)
 */

window.vluLogin = {
    // Chuyển đổi qua lại giữa Tab Đăng nhập và Đăng ký
    initTabs: function() {
        const loginTabBtn = document.getElementById('loginTabBtn');
        const registerTabBtn = document.getElementById('registerTabBtn');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginTabBtn && registerTabBtn) {
            loginTabBtn.onclick = () => {
                if (loginForm) loginForm.style.display = "flex";
                if (registerForm) registerForm.style.display = "none";
                loginTabBtn.classList.add('active');
                registerTabBtn.classList.remove('active');
            };
            registerTabBtn.onclick = () => {
                if (loginForm) loginForm.style.display = "none";
                if (registerForm) registerForm.style.display = "flex";
                registerTabBtn.classList.add('active');
                loginTabBtn.classList.remove('active');
            };
        }
    },

    // Xử lý nộp dữ liệu Form đăng nhập Email & Mật khẩu
    initLoginFormSubmit: function() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        loginForm.onsubmit = (e) => {
            e.preventDefault();
            let emailInput = document.getElementById('loginUser').value.trim();
            const passInput = document.getElementById('loginPass');
            const pass = passInput ? passInput.value : "";

            if (!emailInput) {
                alert("Vui lòng nhập tài khoản đăng nhập!");
                return;
            }

            firebase.auth().signInWithEmailAndPassword(emailInput, pass)
                .catch((error) => {
                    console.error("Lỗi đăng nhập:", error);
                    alert("Đăng nhập thất bại! Vui lòng kiểm tra lại tài khoản và mật khẩu.");
                });
        };
    },

    // Xử lý Đăng nhập qua tài khoản Google Popup
    // Xử lý Đăng nhập qua tài khoản Google Popup (Đã thông luồng tự động tạo tài khoản ngầm)
    loginWithGoogle: function() {
        if (typeof firebase === 'undefined') return;
        const provider = new firebase.auth.GoogleAuthProvider();

        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                const user = result.user;

                console.log("🎯 Đồng bộ Google Auth thành công:", user.email);

                // Nếu muốn gán một thông báo Toast chào mừng sinh viên thân thiện:
                if (window.ui && typeof window.ui.showToast === 'function') {
                    window.ui.showToast(`Chào mừng ${user.displayName || 'Sinh viên VLU'}! 👋`);
                }
            })
            .catch((error) => {
                console.error("Lỗi đăng nhập Google:", error);

                // Giữ nguyên bộ lọc chặn mã lỗi tự kích hoạt ngầm từ Live Server chúng ta đã xử lý trước đó
                if (error.code !== "auth/popup-closed-by-user" && error.code !== "auth/cancelled-popup-request") {
                    alert("Đăng nhập bằng Google thất bại! Vui lòng thử lại.");
                }
            });
    },

    // Xử lý Đăng nhập qua tài khoản Facebook Popup
    loginWithFacebook: function() {
        if (typeof firebase === 'undefined') return;
        const provider = new firebase.auth.FacebookAuthProvider();

        firebase.auth().signInWithPopup(provider)
            .catch((error) => {
                console.error("Lỗi đăng nhập Facebook:", error);
                alert("Đăng nhập bằng Facebook thất bại!");
            });
    }
};

// Đăng ký cổng gọi hành động onclick="window.vluAuthActions.hàm()" từ ngoài file HTML của Duy
window.vluAuthActions = {
    loginWithGoogle: () => window.vluLogin.loginWithGoogle(),
    loginWithFacebook: () => window.vluLogin.loginWithFacebook()
};