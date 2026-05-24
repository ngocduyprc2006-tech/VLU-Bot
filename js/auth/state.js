window.vluAuthState = {
    init: function() {
        if (typeof firebase === 'undefined') return;

        const modal = document.getElementById('authModal');
        const guestBtn = document.getElementById('guestBtn');
        const closeBtn = document.querySelector('.close-modal');
        const userDropdown = document.getElementById('userDropdown');

        if (guestBtn) {
            guestBtn.onclick = (e) => {
                e.stopPropagation();
                const currentUser = firebase.auth().currentUser;
                if (currentUser) {
                    if (userDropdown) {
                        userDropdown.style.display = userDropdown.style.display === "none" ? "block" : "none";
                    }
                } else {
                    if (modal) modal.style.display = "block";
                }
            };
        }

        if (closeBtn) {
            closeBtn.onclick = () => {
                if (modal) modal.style.display = "none";
            };
        }

        window.addEventListener('click', (e) => {
            if (modal && e.target === modal) modal.style.display = "none";
            if (userDropdown && guestBtn && !guestBtn.contains(e.target)) {
                userDropdown.style.display = "none";
            }
        });

        function handleAuthSuccess(user) {
            if (modal) modal.style.display = "none";
            if (guestBtn) {
                guestBtn.innerHTML = `<i class="fas fa-user-check"></i> ${user.displayName || user.email.split('@')[0]}`;
                guestBtn.title = "Bấm vào đây để quản lý tài khoản";
            }

            const adminList = ["ngocduyprc2006@gmail.com", "duy.2474802010071@vanlanguni.vn", "trungvt040106@gmail.com", "phuongtruong121204@gmail.com"];
            const adminModule = document.getElementById('adminModule');
            if (user && adminList.includes(user.email)) {
                if (adminModule) adminModule.style.display = 'block';
            } else {
                if (adminModule) adminModule.style.display = 'none';
            }
        }

        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                handleAuthSuccess(user);
            }
        });
    }
};