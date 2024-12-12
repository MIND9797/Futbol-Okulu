const expand_arrows = document.querySelectorAll('.material-icons-outlined');
const first_div = document.querySelector('.first');
const search_student_div = document.querySelector('.search-student');
const group_div = document.querySelector('.group');
const show_students_div = document.querySelector('.show-students');
const column_names_div = document.querySelector('.column-names');
const student_information_div = document.querySelector('.student-information');

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

async function list_students(){
    const response = await fetch(`/api/students-list`);
    const students = await response.json();
    const studentsList = document.getElementById('students-list');
    studentsList.innerHTML = "";
    students.forEach(student => {
        const formatted_name = student.name.replace(/\s+/g, '-');
        const age = calculateAge(student.birthdate);
        const row = document.createElement('div');
        row.classList.add('student');
        row.innerHTML = `
            <h4 id="h4-name">${student.name}</h4>
            <h4>${age}</h4>
            <h4>${student.group}</h4>
            <a href="/students/${encodeURIComponent(formatted_name)}">
                <div class="icon-wrapper">
                    <i id="arrow-icon" class="material-icons-outlined" data-name="${student.name}">arrow_forward_ios</i>
                </div>
            </a>`;
        studentsList.appendChild(row);
    });
}

const search_tb = document.querySelector('#query');

async function search_students() {
    try {
        const response = await fetch('/api/search-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: search_tb.value })
        });
        const students = await response.json();

        const studentsList = document.getElementById('students-list');
        studentsList.innerHTML = "";
        students.forEach(student => {
            const formatted_name = student.name.replace(/\s+/g, '-');
            const age = calculateAge(student.birthdate);
            const row = document.createElement('div');
            row.classList.add('student');
            row.innerHTML = `
                <h4 id="h4-name">${student.name}</h4>
                <h4>${age}</h4>
                <h4>${student.group}</h4>
                <a href="/students/${encodeURIComponent(formatted_name)}">
                    <div class="icon-wrapper">
                        <i id="arrow-icon" class="material-icons-outlined" data-name="${student.name}">arrow_forward_ios</i>
                    </div>
                </a>`;
            studentsList.appendChild(row);
        });
        
        
    } catch (error) {
        console.error('Hata:', error);
    }
}

let timeout;
search_tb.addEventListener('input', ()=>{
    clearTimeout(timeout); // Eski beklemeyi temizle
    timeout = setTimeout(() => {
        
        search_students();
    }, 200);
})

window.onload = list_students();