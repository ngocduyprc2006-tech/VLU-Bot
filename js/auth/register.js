window.vluRegister = {
    init: function() {
        const registerForm = document.getElementById('registerForm');
        const loginTabBtn = document.getElementById('loginTabBtn');
        if (!registerForm) return;

        registerForm.onsubmit = (e) => {
            e.preventDefault();

            try {
                const emailInput = document.getElementById('regEmail').value.trim().toLowerCase();
                const pass = document.getElementById('regPass').value;
                const confirm = document.getElementById('regPassConfirm').value;

                if (!emailInput) { alert("Vui lòng điền địa chỉ Email!"); return; }
                if (pass.includes(" ")) { alert("Mật khẩu không được chứa khoảng trắng!"); return; }
                if (pass !== confirm) { alert("Mật khẩu nhập lại không khớp!"); return; }

                const accountRegex = /^[a-z]+\.[0-9]+$/;
                if (!accountRegex.test(emailInput)) {
                    alert("🚫 Đăng ký thất bại!\nTài khoản sinh viên phải đúng định dạng: tên.mssv\nVí dụ: a.247480***");
                    return;
                }

                firebase.auth().createUserWithEmailAndPassword(emailInput, pass)
                    .then(() => {
                        alert("Đăng ký thành công! Mời bạn đăng nhập.");
                        if (loginTabBtn) loginTabBtn.click();
                        const loginUserInp = document.getElementById('loginUser');
                        if (loginUserInp) loginUserInp.value = emailInput;
                    })
                    .catch((error) => {
                        console.error("Lỗi đăng ký Firebase:", error);
                        alert("Đăng ký thất bại: " + error.message);
                    });

            } catch (err) {
                console.error("Lỗi lấy dữ liệu form:", err);
                alert("Hệ thống gặp lỗi cấu trúc form, vui lòng kiểm tra lại các ID trong file HTML.");
            }
        };
    }
};