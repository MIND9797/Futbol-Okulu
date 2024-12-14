document.querySelector('#birthdate-icon').addEventListener('click', ()=>{
    document.querySelector('#birthdate').showPicker();
})

document.querySelector('#registration-date-icon').addEventListener('click', ()=>{
    document.querySelector('#registration-date').showPicker();
})

function calculateAge(birthdate) {
    const today = new Date();  // Bugünün tarihi
    const birthDate = new Date(birthdate);  // Doğum tarihi
    let age = today.getFullYear() - birthDate.getFullYear();  // Yıl farkını al

    // Doğum günü henüz geçmediyse, yaşı 1 azalt
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

async function last_registrations(){
    const response = await fetch(`/api/last-registered-students`);
    const students = await response.json();
    const last_registrations_div = document.querySelector('.last-registrations');
    
    students.forEach(student => {
        const formatted_name = student.name.replace(/\s+/g, '-');
        const date = new Date(student.registration_date);
        const formattedDate = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
        const row = document.createElement('div');
        row.classList.add('registration');
        row.innerHTML = `
            <h4 id="h4-name">${student.name}</h4>
            <h5>${formattedDate}</h5>
            <a href="/students/${encodeURIComponent(formatted_name)}">
                <div class="icon-wrapper">
                    <i id="arrow-icon" class="material-icons-outlined" data-name="${student.name}">arrow_forward_ios</i>
                </div>
            </a>`;
            last_registrations_div.appendChild(row);
    });
}

async function google_form_registrations() {
    const response = await fetch(`/api/form-student-registrations`);
    const students = await response.json();
    const registrations_div = document.querySelector('.registrations');
    const registration_count = document.querySelector('.inner');
    registration_count.innerHTML = `+${students.length}`;
    if(students.length > 0) registration_count.style.display = 'block';

    students.forEach(student => {
        const situation1 = (student[10] === "Hayır, yoktur.") ? "Olumlu" : "Olumsuz";
        const icon1 = (student[10] === "Hayır, yoktur.") ? "check" : "close";
        const situation2 = (student[11] === "Evet, onay veriyorum.") ? "Olumlu" : "Olumsuz";
        const icon2 = (student[11] === "Evet, onay veriyorum.") ? "check" : "close";
        const situation3 = (student[12] === "Evet, ederim.") ? "Olumlu" : "Olumsuz";
        const icon3 = (student[12] === "Evet, ederim.") ? "check" : "close";
        const situation4 = (student[13] === "Evet, kabul ediyorum.") ? "Olumlu" : "Olumsuz";
        const icon4 = (student[13] === "Evet, kabul ediyorum.") ? "check" : "close";

        const rawDate = student[3];
        const [day, month, year] = rawDate.split(".");
        const birthdate = new Date(`${year}-${month}-${day}`);
        const formattedBirthDate = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).format(birthdate);
        const tarihStr = student[0];
        const [gun, ay, yilSaat] = tarihStr.split(".");
        const [yil, saat] = yilSaat.split(" ");
        const isoTarih = `${yil}-${ay}-${gun}T${saat}`;
        const registrationDate = new Date(isoTarih);
        const formattedRegistrationDate = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).format(registrationDate);
        const age = calculateAge(birthdate);
        const row = document.createElement('div');
        row.classList.add('registration');
        row.innerHTML = `
            <div class="base-info">
                <h4 id="h4-name">${student[1]}</h4>
                <h5>${formattedRegistrationDate}</h5>
                <div class="icon-wrapper">
                    <i id="arrow-icon" class="material-icons-outlined" data-name="${student[1]}">keyboard_arrow_down</i>
                </div>
            </div>
            <div class="details">
                <div class="info">
                    <h4>Adı</h4>
                    <h5>${student[1]}</h5>
                </div>
                <div class="info">
                    <h4>TC Kimlik No</h4>
                    <h5>${student[2]}</h5>
                </div>
                <div class="info">
                    <h4>Doğum Tarihi</h4>
                    <h5>${formattedBirthDate}</h5>
                </div>
                <div class="info">
                    <h4>Yaş</h4>
                    <h5>${age} Yaşında</h5>
                </div>
                <div class="info">
                    <h4>Baba Adı</h4>
                    <h5>${student[4]}</h5>
                </div>
                <div class="info">
                    <h4>Baba Telefon</h4>
                    <h5>${student[5]}</h5>
                </div>
                <div class="info">
                    <h4>Anne Adı</h4>
                    <h5>${student[6]}</h5>
                </div>
                <div class="info">
                    <h4>Anne Telefon</h4>
                    <h5>${student[7]}</h5>
                </div>
                <div class="info">
                    <h4>Okul</h4>
                    <h5>${student[8]}</h5>
                </div>
                <div class="info">
                    <h4>Adres</h4>
                    <h5>${student[9]}</h5>
                </div>
                <div class="articles">
                    <div class="info">
                        <h4>1. Madde</h4>
                        <h5>${situation1}<i id="icon-article-1" class="material-icons ${icon1}">${icon1}</i></h5>
                    </div>
                    <div class="info">
                        <h4>2. Madde</h4>
                        <h5>${situation2}<i id="icon-article-2" class="material-icons ${icon2}">${icon2}</i></h5>
                    </div>
                    <div class="info">
                        <h4>3. Madde</h4>
                        <h5>${situation3}<i id="icon-article-3" class="material-icons ${icon3}">${icon3}</i></h5>
                    </div>
                    <div class="info">
                        <h4>4. Madde</h4>
                        <h5>${situation4}<i id="icon-article-4" class="material-icons ${icon4}">${icon4}</i></h5>
                    </div>
                </div>
                <div class="buttons">
                    <div class="accept-button-wrapper">
                        <button class="button accept-button">Kabul Et</button>
                    </div>
                    <div class="reject-button-wrapper">
                        <button class="button reject-button">Reddet</button>
                    </div>
                </div>
            </div>`;
        registrations_div.appendChild(row);

        const arrow_icon = row.querySelector('#arrow-icon');
        const details = row.querySelector('.details');

        arrow_icon.addEventListener('click', ()=>{
            if(arrow_icon.innerHTML === 'keyboard_arrow_down'){
                details.style.display = 'block';
                arrow_icon.innerHTML = 'keyboard_arrow_up';
            }
            else{
                details.style.display = 'none';
                arrow_icon.innerHTML = 'keyboard_arrow_down';
            }
        })

        const accept_button = row.querySelector('.accept-button');

        accept_button.addEventListener('click', async ()=>{
            try {
                const response = await fetch('/api/new-student', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: student[1].trim(), tc: student[2], birthdate: birthdate, registration_date: registrationDate,
                    group: '1', school: student[8], father_name: student[4], father_phone: student[5],
                    mother_name: student[6], mother_phone: student[7], adress: student[9], membership: 'Aktif' })
                });
        
                const data = await response.json();
                if(data == 'OK') {
                    const formatted_name = student[1].replace(/\s+/g, '-');
                    const response = await fetch(`/api/form-student-delete/${encodeURIComponent(formatted_name)}`);
                    const data = await response.json();
                    if(data == 'OK') alert('Öğrenci kaydedildi!');
                    window.location.href = '../new-registrations';
                }
            } catch (error) {
                console.error('Hata:', error);
            }
        })
    });
}

const save_button = document.querySelector('.add_student_button');

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

document.getElementById('new-student-form').addEventListener('submit', async (event) => {
    event.preventDefault(); 

    try {
        const response = await fetch('/api/new-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name_.value, tc: tc_.value, birthdate: birthdate_.value, registration_date: registration_date_.value,
            group: group_.value, school: school_.value, father_name: father_name_.value, father_phone: father_phone_.value,
            mother_name: mother_name_.value, mother_phone: mother_phone_.value, adress: adress_.value, membership: membership_ })
        });

        const data = await response.json();
        if(data == 'OK') {
            alert('Öğrenci kaydedildi!');
            window.location.href = '../new-registrations';
        }
    } catch (error) {
        console.error('Hata:', error);
    }
});

const infos = document.querySelectorAll('.info');

for (let i = 0; i < infos.length; i++) {
    const _input = infos[i].getElementsByTagName('input')[0];
    const _texarea = infos[i].getElementsByTagName('textarea')[0];
    
    const _label = infos[i].querySelector('.label');
    const _underline = infos[i].querySelector('.underline');

    if(_input){
        _input.addEventListener('input', ()=>{
            if(_input.value != ""){
                _label.style.color = '#adff2f';
                _label.style.top = '-20px';
                _underline.style.transform = 'scaleX(1)';
            }
            else{
                _label.style.color = '#F5F5F5';
                _label.style.top = '0px';
                _underline.style.transform = 'scaleX(0)';
            }
        })
    }
    else if(_texarea){
        _texarea.addEventListener('input', ()=>{
            if(_texarea.value != ""){
                _label.style.color = '#adff2f';
                _underline.style.transform = 'scaleX(1)';
            }
            else{
                _label.style.color = '#F5F5F5';
                _underline.style.transform = 'scaleX(0)';
            }
        })
    }
}


function loadPage(){
    last_registrations();
    google_form_registrations();
}

window.onload = loadPage();