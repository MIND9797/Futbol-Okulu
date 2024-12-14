let config;

async function get_config() {
    const response = await fetch(`/api/config`);
    const data = await response.json();
    config = data[0];
    
}

async function check_new_payments() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    try {
        const response = await fetch('/api/check-month', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ month: month, year: year })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Hata:', error);
    }
}

async function new_payments() {
    const exists = await check_new_payments();
    if(exists === 'EXISTS') return;

    const response = await fetch(`/api/students-list`);
    const students = await response.json();

    const today = new Date();
    const month_ = today.getMonth() + 1;
    const year_ = today.getFullYear();

    const payment_date = {
        month: month_,
        year: year_
    };

    students.forEach(async student => {
        const owner = student._id;
        try {
            const response = await fetch('/api/add-unpaid-payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ owner, payment_date })
            });

            const result = await response.json();
            if (!response.ok) alert('Hata: ' + result.message);
        } catch (error) {
            console.error('İstek hatası:', error);
            alert('Sunucuya bağlanırken bir hata oluştu.');
        }
    });

    try {
        const month = month_;
        const year = year_;
        const response = await fetch('/api/add-month', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month, year })
        });

        const result = await response.json();
        if (!response.ok) alert('Hata: ' + result.message);
    } catch (error) {
        console.error('İstek hatası:', error);
        alert('Sunucuya bağlanırken bir hata oluştu.');
    }

    unpaid_payments(1, "");
}

async function last_payments() {
    const response = await fetch(`/api/last-payments`);
    const payments = await response.json();
    const last_payments_div = document.querySelector('.last-payments-wrapper');
    last_payments_div.innerHTML = "";
    payments.forEach(payment => {
        const rawDate = new Date(payment.date_paid);
        const formattedDatePaid = new Intl.DateTimeFormat('tr-TR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        }).format(rawDate);
        const row = document.createElement('div');
        row.classList.add('last-payment-element');
        row.innerHTML = `
            <h4>${payment.owner.name}</h4>
            <h4>${payment.amount} TL</h4>
            <h5>${months[payment.payment_date.month - 1]}/${payment.payment_date.year} <i class="material-icons circle-icon">circle</i> ${formattedDatePaid}</h5>`;
        last_payments_div.appendChild(row);
    });
}

const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const info = ['Bu Ay', 'Geçen Ay', ' Ay Önce', ' Yıl Önce'];

async function find_search_results(name) {
    const search_results = document.querySelector('#unpaid-payments-search-results');
    search_results.innerHTML = "";
    if(name == ""){
        search_results.style.display = 'none';
        return;
    }
    const response = await fetch('/api/search-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    const students = await response.json();
    if (response.ok){
        search_results.style.display = 'flex';
        students.forEach(student => {
            const row = document.createElement('div');
            row.classList.add('search-element');
            row.innerHTML = student.name;
            search_results.appendChild(row);
            row.addEventListener('click', ()=>{
                query.value = student.name;
                search_results.style.display = 'none';
                unpaid_payments(2, student._id);
            })
        });
    }
}

const query = document.querySelector('#query');
let timeout;
query.addEventListener('input', async ()=>{
    clearTimeout(timeout); // Eski beklemeyi temizle
    timeout = setTimeout(() => {
        
        find_search_results(query.value);
    }, 500);
    
})

async function transfer_unpaid_payment(_id, owner, amount, payment_date, date_paid) {
    try {
        const response = await fetch('/api/delete-unpaid-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ _id: _id, owner: owner, amount: amount, payment_date: payment_date, date_paid: date_paid })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Hata:', error);
    }
    return;
}

async function unpaid_payments(type, id) {
    const today = new Date();
    const month = today.getMonth() + 1;
    let response;
    let payments;
    if(type == 1){
        response = await fetch(`/api/unpaid-payments`);
        payments = await response.json();
    }
    else{
        response = await fetch(`/api/unpaid-payments/${id}`);
        payments = await response.json();
    }
    
    const unpaid_payments_div = document.querySelector('.unpaid-payments-elements');
    unpaid_payments_div.innerHTML = "";
    payments.forEach(payment => {
        let info_;
        if(payment.payment_date.month === month) info_ = info[0];
        else if(payment.payment_date.month === month - 1) info_ = info[1];
        else{
            const offset = month - payment.payment_date.month;
            info_ = offset + info[2];
        }
        const row = document.createElement('div');
        row.classList.add('payment-element');
        row.innerHTML = `
            <div class="top">
                <h4>${payment.owner.name}</h4>
                <div class="date">
                    <div class="date-div">${months[payment.payment_date.month - 1]}/${payment.payment_date.year}</div>
                    <div class="offset">${info_}</div>
                </div>
                <i id="arrow-icon" class="material-icons-outlined">keyboard_arrow_down</i>
            </div>
            <div class="bottom unpaid-bottom">
                <div class="unpaid-inputs-wrapper">
                    <div class="input-container">
                        <input type="date" id="payment-date" required="">
                        <label for="payment-date" class="label lbl">Ödeme Tarihi</label>
                        <i id="payment-date-icon" class="material-icons calendar">calendar_today</i>
                        <div class="underline"></div>
                    </div>
                    <input id="dues-input" type="text">
                    <div id="TL">TL</div>
                </div>
                <div class="unpaid-buttons-wrapper">
                    <div class="ok button_wrapper">
                    <button class="button">Tamamla</button>
                    </div>
                    <div class="cancel button_wrapper">
                        <button class="button">İptal Et</button>
                    </div>
                </div>
            </div>`;
        unpaid_payments_div.appendChild(row);

        const icon = row.querySelector('#arrow-icon');
        const bottom = row.querySelector('.bottom');
        const pay = row.querySelector('.ok');

        icon.addEventListener('click', ()=>{
            const width = window.innerWidth;
            if(icon.innerHTML === 'keyboard_arrow_down'){
                if(width > 400) row.style.height = '170px';
                else row.style.height = '200px';
                icon.innerHTML = 'keyboard_arrow_up';
                setTimeout(() => {
                    bottom.style.display = 'flex';
                }, 200);
            }
            else{
                bottom.style.display = 'none';
                icon.innerHTML = 'keyboard_arrow_down';
                if(width > 400) row.style.height = '45px';
                else row.style.height = '70px';
            }
        })

        const dues_tb = row.querySelector('#dues-input');
        const calendar =  row.querySelector('#payment-date');
        const calendar_icon = row.querySelector('#payment-date-icon');

        dues_tb.value = config.dues;
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-CA');
        calendar.value = formattedDate;

        dues_tb.addEventListener('input', ()=>{
            const isPositiveNumber = !isNaN(dues_tb.value) && parseFloat(dues_tb.value) > 0;
            if(!isPositiveNumber) dues_tb.style.color = 'red';
            else dues_tb.style.color = 'unset';
        })

        calendar_icon.addEventListener('click', ()=>{
            calendar.showPicker();
        })

        pay.addEventListener('click', async ()=>{
            const amount = dues_tb.value;
            const date_paid = calendar.value;
            
            const response = await transfer_unpaid_payment(payment._id, payment.owner._id, amount, payment.payment_date, date_paid);
            if(response == 'OK'){
                alert('Ödeme Alındı!');
                last_payments();
                edit_payments(1, '');
                unpaid_payments(1, '');
            }
        })
    });
}

async function find_edit_search_results(name) {
    const search_results = document.querySelector('#edit-payments-search-results');
    search_results.innerHTML = "";
    if(name == ""){
        search_results.style.display = 'none';
        return;
    }
    const response = await fetch('/api/search-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    const students = await response.json();
    if (response.ok){
        search_results.style.display = 'flex';
        students.forEach(student => {
            const row = document.createElement('div');
            row.classList.add('search-element');
            row.innerHTML = student.name;
            search_results.appendChild(row);
            row.addEventListener('click', ()=>{
                query_edit.value = student.name;
                search_results.style.display = 'none';
                edit_payments(2, student._id);
            })
        });
    }
}

const query_edit = document.querySelector('#query_edit');
let timeout_edit;
query_edit.addEventListener('input', async ()=>{
    clearTimeout(timeout_edit); // Eski beklemeyi temizle
    timeout_edit = setTimeout(() => {
        
        find_edit_search_results(query_edit.value);
    }, 500);
})

async function reverse_transfer_unpaid_payment(_id, owner, amount, payment_date) {
    try {
        const response = await fetch('/api/add-unpaid-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ _id: _id, owner: owner, amount: amount, payment_date: payment_date })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Hata:', error);
    }
    return;
}

async function edit_payments(type, id) {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    let response;
    let payments;
    if(type == 1){
        response = await fetch(`/api/payments-list`);
        payments = await response.json();
    }
    else{
        response = await fetch(`/api/payments-list/${id}`);
        payments = await response.json();
    }

    const edit_payments_div = document.querySelector('.edit-payments-elements');
    edit_payments_div.innerHTML = "";
    if(payments.length == 0) edit_payments_div.innerHTML = "Herhangi bir ödeme kaydı bulunamadı!";
    payments.forEach(payment => {
        let info_;
        if((payment.payment_date.month < month && payment.payment_date.year < year) || payment.payment_date + 1 < year){
            const offset = year - payment.payment_date.year;
            info_ = offset + info[3];
        }
        else{
            if(payment.payment_date.month === month) info_ = info[0];
            else if(payment.payment_date.month === month - 1) info_ = info[1];
            else{
                const offset = month - payment.payment_date.month;
                info_ = offset + info[2];
            }
        }
        const row = document.createElement('div');
        row.classList.add('payment-element');
        row.classList.add('edit-element');
        row.innerHTML = `
            <div class="top">
                <h4>${payment.owner.name}</h4>
                <div class="date">
                    <div class="date-div">${months[payment.payment_date.month - 1]}/${payment.payment_date.year}</div>
                    <div class="offset">${info_}</div>
                </div>
                <i id="arrow-icon" class="material-icons-outlined">keyboard_arrow_down</i>
            </div>
            <div class="bottom edit-bottom">
                <div class="edit-inputs-wrapper">
                    <div class="input-container">
                        <input type="date" id="payment-date" required="">
                        <label for="payment-date" class="label lbl">Ödeme Tarihi</label>
                        <i id="payment-date-icon" class="material-icons calendar">calendar_today</i>
                        <div class="underline"></div>
                    </div>
                    <input id="dues-input" type="text">
                    <div id="TL">TL</div>
                </div>
                <div class="edit-buttons-wrapper">
                    <div class="pay button_wrapper">
                    <button class="button">Düzenle</button>
                    </div>
                    <div class="cancel button_wrapper">
                        <button class="button">İptal Et</button>
                    </div>
                </div>
            </div>`;
        edit_payments_div.appendChild(row);

        const icon = row.querySelector('#arrow-icon');
        const bottom = row.querySelector('.bottom');
        const cancel = row.querySelector('.cancel');

        icon.addEventListener('click', ()=>{
            const width = window.innerWidth;
            if(icon.innerHTML === 'keyboard_arrow_down'){
                if(width > 400) row.style.height = '170px';
                else row.style.height = '200px';
                icon.innerHTML = 'keyboard_arrow_up';
                setTimeout(() => {
                    bottom.style.display = 'flex';
                }, 200);
            }
            else{
                bottom.style.display = 'none';
                icon.innerHTML = 'keyboard_arrow_down';
                if(width > 400) row.style.height = '45px';
                else row.style.height = '70px';
            }
        })

        const dues_tb = row.querySelector('#dues-input');
        const calendar =  row.querySelector('#payment-date');
        const calendar_icon = row.querySelector('#payment-date-icon');

        dues_tb.value = payment.amount;
        const date_paid = new Date(payment.date_paid);
        const formattedDate = date_paid.toLocaleDateString('en-CA');
        calendar.value = formattedDate;

        dues_tb.addEventListener('input', ()=>{
            const isPositiveNumber = !isNaN(dues_tb.value) && parseFloat(dues_tb.value) > 0;
            if(!isPositiveNumber) dues_tb.style.color = 'red';
            else dues_tb.style.color = 'unset';
        })

        calendar_icon.addEventListener('click', ()=>{
            calendar.showPicker();
        })

        cancel.addEventListener('click', async ()=>{
            const amount = dues_tb.value;
            
            const response = await reverse_transfer_unpaid_payment(payment._id, payment.owner._id, amount, payment.payment_date);
            if(response == 'OK'){
                alert('Ödeme İptal Edildi!');
                last_payments();
                edit_payments(1, '');
                unpaid_payments(1, '');
            }
        })

        const pay = row.querySelector('.pay');

        pay.addEventListener('click', async ()=>{
            try {
                const response = await fetch('/api/update-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: payment._id, amount: dues_tb.value, date_paid: calendar.value })
                });
        
                const data = await response.json();
                if(data == 'OK') {
                    alert('Ödeme başarıyla düzenlendi!');
                    last_payments();
                    edit_payments(1, '');
                    unpaid_payments(1, '');
                }
            } catch (error) {
                console.error('Hata:', error);
            }
        })
    })
}

function Tasks(){
    get_config();
    last_payments();
    unpaid_payments(1, '');
    edit_payments(1, '');
    new_payments();
}

window.onload = Tasks();