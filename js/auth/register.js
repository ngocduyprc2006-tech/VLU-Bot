/** * FILE: js/auth/register.js
 * CHỨC NĂNG: Kiểm tra dữ liệu hợp lệ và thực hiện Đăng ký tài khoản mới lên Firebase
 */

window.vluRegister = {
    init: function() {
        const registerForm = document.getElementById('registerForm');
        const loginTabBtn = document.getElementById('loginTabBtn');
        if (!registerForm) return;

        registerForm.onsubmit = (e) => {
            e.preventDefault();
            let emailInput = document.getElementById('regEmail').value.trim();
            const pass = document.getElementById('regPass').value;
            const confirm = document.getElementById('regPassConfirm').value;

            if (!emailInput) { alert("Vui lòng điền địa chỉ Email!"); return; }
            if (!emailInput.includes("@")) { alert("Vui lòng nhập đúng định dạng Email!"); return; }
            if (pass.includes(" ")) { alert("Mật khẩu không được chứa khoảng trắng!"); return; }
            if (pass !== confirm) { alert("Mật khẩu nhập lại không khớp!"); return; }

            firebase.auth().createUserWithEmailAndPassword(emailInput, pass)
                .then(() => {
                    alert("Đăng ký thành công! Mời bạn đăng nhập.");
                    if (loginTabBtn) loginTabBtn.click();
                    const loginUserInp = document.getElementById('loginUser');
                    if (loginUserInp) loginUserInp.value = emailInput;
                })
                .catch((error) => {
                    console.error("Lỗi đăng ký:", error);
                    alert("Đăng ký thất bại: " + error.message);
                });
        };
    }
};