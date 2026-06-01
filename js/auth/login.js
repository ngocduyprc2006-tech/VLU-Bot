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

                const accountRegex = /^[a-z]+\.[0-9]+$/;

                if (!accountRegex.test(emailInput)) {
                    alert("🚫 Đăng nhập thất bại!\nTài khoản đăng nhập phải đúng định dạng sinh viên: tên.mssv\nVí dụ: ten.mssv");
                    return;
                }

                firebase.auth().signInWithEmailAndPassword(emailInput, passInput)
                    .then((userCredential) => {
                        console.log("Đăng nhập thành công hệ thống nội bộ VLU:", userCredential.user.email);

                        const authModal = document.getElementById('authModal');
                        if (authModal) {
                            authModal.style.display = "none";
                            authModal.classList.remove("show");
                        } else {
                            window.location.href = "index.html";
                        }
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
    },

    initMicrosoftAuth: function() {
        const msBtn = document.getElementById('microsoftLoginBtn');
        if (!msBtn) return;

        msBtn.onclick = async(e) => {
            e.preventDefault();
            const provider = new firebase.auth.OAuthProvider('microsoft.com');

            provider.setCustomParameters({
                prompt: 'select_account',
                tenant: 'common'
            });

            try {
                const result = await firebase.auth().signInWithPopup(provider);
                const user = result.user;

                if (!user.email.endsWith('@vanlanguni.vn')) {
                    await firebase.auth().signOut();
                    alert("❌ Truy cập bị từ chối! Hệ thống chỉ cho phép tài khoản Microsoft Mail trường Văn Lang đăng nhập.");
                    return;
                }

                console.log("Đăng nhập thành công bằng Microsoft:", user.email);

                const authModal = document.getElementById('authModal');
                if (authModal) {
                    authModal.style.display = "none";
                    authModal.classList.remove("show");
                } else {
                    window.location.href = "index.html";
                }

            } catch (error) {
                console.error("Lỗi xác thực Microsoft:", error);
                alert("❌ Đăng nhập bằng Microsoft thất bại: " + error.message);
            }
        };
    }
};