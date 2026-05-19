window.vluLogin = {
    initTabs: function() {
        const loginTabBtn = document.getElementById('loginTabBtn');
        const registerTabBtn = document.getElementById('registerTabBtn');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginTabBtn && registerTabBtn && loginForm && registerForm) {
            loginTabBtn.onclick = () => {
                registerTabBtn.classList.remove('active');
                loginTabBtn.classList.add('active');
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
            };
            registerTabBtn.onclick = () => {
                loginTabBtn.classList.remove('active');
                registerTabBtn.classList.add('active');
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
            };
        }
    },

    initLoginFormSubmit: function() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        loginForm.onsubmit = (e) => {
            e.preventDefault();

            try {
                const emailInput = document.getElementById('loginUser').value.trim().toLowerCase();
                const passInput = document.getElementById('loginPass').value;

                if (!emailInput || !passInput) {
                    alert("Vui lòng điền đầy đủ tài khoản và mật khẩu!");
                    return;
                }

                // 🎯 REGEX ÉP ĐÚNG KHUÔN MẪU: ten.mssv@vanlanguni.vn KHI ĐĂNG NHẬP
                const vluEmailRegex = /^[a-z]+\.[0-9]+@vanlanguni\.vn$/;

                if (!vluEmailRegex.test(emailInput)) {
                    alert("🚫 Đăng nhập thất bại!\nTài khoản phải đúng định dạng email sinh viên: tên.mssv@vanlanguni.vn");
                    return;
                }

                firebase.auth().signInWithEmailAndPassword(emailInput, passInput)
                    .then((userCredential) => {
                        console.log("Đăng nhập thành công hệ thống nội bộ VLU:", userCredential.user.email);
                        window.location.href = "index.html";
                    })
                    .catch((error) => {
                        console.error("Lỗi đăng nhập Firebase:", error);
                        alert("Sai tài khoản hoặc mật khẩu, vui lòng kiểm tra lại!");
                    });

            } catch (err) {
                console.error("Lỗi xử lý đăng nhập:", err);
                alert("Hệ thống gặp lỗi cấu trúc form đăng nhập.");
            }
        };
    }
};