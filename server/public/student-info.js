const payments_list = document.querySelector('.payments-list');
const owner_id = payments_list.dataset.id;


class Payments {
    constructor(payment_date, amount, date_paid) {
        this.payment_date = payment_date;
        this.amount = amount;
        this.date_paid = date_paid;
    }
}

let payments_array = [];

async function get_payments_info() {
    try {
        const response = await fetch('/api/find-payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ owner: owner_id })
        });
        const payments = await response.json();

        payments.forEach(payment => {
            payments_array.push(new Payments(payment.payment_date, payment.amount, payment.date_paid));
        });
        return true;
        
    } catch (error) {
        console.error('Hata:', error);
        return false;
    }
}

async function get_unpaid_payments_info() {
    try {
        const response = await fetch('/api/find-unpaid-payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ owner: owner_id })
        });
        const payments = await response.json();

        payments.forEach(payment => {
            payments_array.push(new Payments(payment.payment_date, '-', 'Ödeme Bekleniyor'));
        });
        return true;
        
    } catch (error) {
        console.error('Hata:', error);
        return false;
    }
}

function order(){
    payments_array.sort((a, b) => {
        const dateA = a.payment_date;
        const dateB = b.payment_date;
    
        // Önce yılları karşılaştır
        if (dateA.year !== dateB.year) {
            return dateB.year - dateA.year; // Yılları azalan sırada sıralar
        }
    
        // Yıllar eşitse ayları karşılaştır
        return dateB.month - dateA.month; // Ayları azalan sırada sıralar
    });
}

const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function add_payment_element(payment, row) {
    if(payment.amount != '-'){
        const rawDate = new Date(payment.date_paid);
        const formattedDatePaid = new Intl.DateTimeFormat('tr-TR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        }).format(rawDate);
        row.innerHTML = `
        <h2 id="payment-date">${months[payment.payment_date.month - 1]}/${payment.payment_date.year}</h2>
        <h2 id="payment-value">${payment.amount} TL</h2>
        <h3 id="date-paid">${formattedDatePaid}</h3>`;
    }
    else{
        row.classList.remove('payment');
        row.classList.add('payment-missing');
        row.innerHTML = `
        <h2 id="payment-date-missing">${months[payment.payment_date.month - 1]}/${payment.payment_date.year}</h2>
        <h2 id="payment-value-missing">-</h2>
        <h3 id="date-paid-missing">${payment.date_paid}</h3>`;
    }
}

function show_payments() {
    order();
    
    let last_payment_date = {
        month: 0,
        year: 0
    };
    let i = 0;
    while(i < payments_array.length){
        let unknown = false;
        const row = document.createElement('div');
        row.classList.add('payment');
        
        if(last_payment_date.year == 0) add_payment_element(payments_array[i], row);
        else if(last_payment_date.month - 1 == payments_array[i].payment_date.month && last_payment_date.year == payments_array[i].payment_date.year) add_payment_element(payments_array[i], row);
        else if(last_payment_date.month + 11 == payments_array[i].payment_date.month && last_payment_date.year == payments_array[i].payment_date.year + 1) add_payment_element(payments_array[i], row);
        else {
            if(last_payment_date.month == 1){
                row.classList.remove('payment');
                row.classList.add('payment-unknown');
                row.innerHTML = `
                <h2 id="payment-date-unknown">${months[11]}/${last_payment_date.year - 1}</h2>
                <h2 id="payment-value-unknown">-</h2>
                <h3 id="date-paid-unknown">Ödeme Atlandı!</h3>`;
                i--;
                unknown = true;
            }
            else{
                row.classList.remove('payment');
                row.classList.add('payment-unknown');
                row.innerHTML = `
                <h2 id="payment-date-unknown">${months[last_payment_date.month - 2]}/${last_payment_date.year}</h2>
                <h2 id="payment-value-unknown">-</h2>
                <h3 id="date-paid-unknown">Ödeme Atlandı!</h3>`;
                i--;
                unknown = true;
            }
        }
        

        if(unknown){
            if(last_payment_date.month == 1){
                last_payment_date.month = 12;
                last_payment_date.year--;
            }
            else last_payment_date.month--;
        }
        else{
            last_payment_date = {
                month: payments_array[i].payment_date.month,
                year: payments_array[i].payment_date.year
            };
        }

        payments_list.appendChild(row);
        i++;
    }
}

const modal_delete = document.querySelector('.modal-delete-wrapper');
document.querySelector('.student-delete').addEventListener('click', ()=>{
    modal_delete.style.display = 'flex';
})

document.querySelector('#close-icon').addEventListener('click', ()=>{
    modal_delete.style.display = 'none';
    delete_tb.value = "";
    button_delete.classList.remove('button');
    button_delete.classList.add('button-delete');
    delete_tb.style.color = '#F5F5F5';
    delete_tb.style.borderColor = '#F5F5F5';
})

const modal_update = document.querySelector('.modal-update-wrapper');
document.querySelector('.student-edit').addEventListener('click', ()=>{
    modal_update.style.display = 'flex';
    if (textarea.value.trim() !== "") {
        textarea.classList.add('has-content');
    } 
})

document.querySelector('#close-icon-update').addEventListener('click', ()=>{
    modal_update.style.display = 'none';
})

const textarea = document.getElementById('adress');

textarea.addEventListener('input', () => {
    if (textarea.value.trim() !== "") {
        textarea.classList.add('has-content');
    } else {
        textarea.classList.remove('has-content');
    }
});

const name_ = document.querySelector('#name');
const tc_ = document.querySelector('#tc');
const birthdate_ = document.querySelector('#birthdate');
const registration_date_ = document.querySelector('#registration-date');
const group_ = document.querySelector('#group');
const school_ = document.querySelector('#school');
const father_name_ = document.querySelector('#father-name');
const father_phone_ = document.querySelector('#father-phone');
const mother_name_ = document.querySelector('#mother-name');
const mother_phone_ = document.querySelector('#mother-phone');
const adress_ = document.querySelector('#adress');
const membership_ = 'Aktif';

document.querySelector('.update_student_button').addEventListener('click', async ()=>{
    try {
        const response = await fetch('/api/update-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: owner_id, name: name_.value, tc: tc_.value, birthdate: birthdate_.value, registration_date: registration_date_.value,
            group: group_.value, school: school_.value, father_name: father_name_.value, father_phone: father_phone_.value,
            mother_name: mother_name_.value, mother_phone: mother_phone_.value, adress: adress_.value, membership: membership_ })
        });

        const data = await response.json();
        if(data == 'OK') {
            modal_update.style.display = 'none';
            modal_delete_ok.querySelector('#delete-ok-message').innerText = 'Öğrenci bilgileri başarıyla güncellenmiştir!';
            modal_delete_ok.style.display = 'flex';
        }
    } catch (error) {
        console.error('Hata:', error);
    }
})

const delete_tb = document.querySelector('#student-delete-tb');
const button_delete = document.querySelector('.button-delete');
const button = document.querySelector('.delete-sec');

delete_tb.addEventListener('input', ()=>{
    if(delete_tb.value == delete_tb.dataset.name){
        delete_tb.style.borderColor = 'red';
        button_delete.classList.remove('button-delete');
        button_delete.classList.add('button');
    }
    else{
        button_delete.classList.remove('button');
        button_delete.classList.add('button-delete');
        delete_tb.style.color = '#F5F5F5';
        delete_tb.style.borderColor = '#F5F5F5';
    }
})

const modal_delete_ok = document.querySelector('.modal-delete-ok-wrapper');

button.addEventListener('click', async ()=>{
    if(button.classList.contains('button')){
        const _id = button.dataset.id;
        try {
            const response = await fetch('/api/delete-student', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ _id: _id })
            });
    
            const data = await response.json();
            if(data == 'OK') {
                try {
                    const response = await fetch('/api/delete-student-payments', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ _id: _id })
                    });
            
                    const data = await response.json();
                    if(data == 'OK') {
                        modal_delete.style.display = 'none';
                        modal_delete_ok.style.display = 'flex';
                    }
                } catch (error) {
                    console.error('Hata:', error);
                }
            }
        } catch (error) {
            console.error('Hata:', error);
        }
    }
})

document.querySelector('.delete_student_ok_button').addEventListener('click', ()=>{
    window.location.href = '../search-student';
})

modal_delete_ok.querySelector('#close-icon').addEventListener('click', ()=>{
    window.location.href = '../search-student';
})

const copy_father_phone = document.querySelector('#copy-father-phone');
const father_phone = document.querySelector('#father-phone');

copy_father_phone.addEventListener('click', ()=>{
    navigator.clipboard.writeText(father_phone.dataset.phone);
})

const copy_mother_phone = document.querySelector('#copy-mother-phone');
const mother_phone = document.querySelector('#mother-phone');

copy_mother_phone.addEventListener('click', ()=>{
    navigator.clipboard.writeText(mother_phone.dataset.phone);
})

async function Tasks() {
    const response1 = await get_payments_info();
    let response2;
    if(response1) response2 = await get_unpaid_payments_info();
    if(response1 && response2) show_payments();
}

window.onload = Tasks();