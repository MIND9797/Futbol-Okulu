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

const delete_tb = document.querySelector('#student-delete-tb');
const button_delete = document.querySelector('.button-delete');

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

async function Tasks() {
    const response1 = await get_payments_info();
    let response2;
    if(response1) response2 = await get_unpaid_payments_info();
    if(response1 && response2) show_payments();
}

window.onload = Tasks();