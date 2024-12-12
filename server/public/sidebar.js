async function count_registrations() {
    const response = await fetch(`/api/form-student-registrations-count`);
    const count = await response.json();
    const registration_count = document.querySelector('.registration-count');
    registration_count.innerHTML = `+${count}`;
    if(count > 0) registration_count.style.display = 'block';
}

window.onload = count_registrations();