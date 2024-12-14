document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Formun varsayılan gönderimini engelle

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            // Giriş başarılı, yönlendirme yap
            window.location.href = '/search-student';
        } else if (response.status === 401) {
            // Hata mesajını göster
            document.getElementById('wrong_info').style.height = '20px';
            setTimeout(() => {
                document.getElementById('wrong_info').style.height = '0px';
            }, 3000);
        } else {
            // Diğer hatalar
            console.error('Bilinmeyen bir hata oluştu:', response.status);
        }
    } catch (error) {
        console.error('Sunucuya bağlanırken bir hata oluştu:', error);
    }
});
