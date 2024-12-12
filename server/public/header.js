const header_bottom = document.querySelector('.header-bottom');
const header = document.querySelector('.header');

document.addEventListener('click', (event)=>{
    const clickedElement = event.target;
    if((clickedElement.id == 'header-left' || clickedElement.id == 'menu-icon') && header_bottom.style.height == '0px') header_bottom.style.height = '250px';
    else{
        header_bottom.style.height = '0px';
    }
})