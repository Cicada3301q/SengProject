// Send registration info to server
document.querySelector('.regis-button').addEventListener('click', function() {
    if (changePage('register'))
        return;
    let url = 'register';
    fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            'firstname': document.querySelector('#first-name').value,
            'lastname': document.querySelector('#last-name').value,
            'email': document.querySelector('#email').value,
            'password': document.querySelector('#password').value
        }),
        headers: {'Content-Type': 'application/json'}
    })
        .then(
            response => response.json().then(
                data => ({status: response.status, msg: data.msg})))
        .then(response => showMessage(response))
})

document.querySelector('.login-button').addEventListener('click', function() {
    if (changePage('login'))
        return;
    let url = 'login';
    fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            'email': document.querySelector('#email').value,
            'password': document.querySelector('#password').value
        }),
        headers: {'Content-Type': 'application/json'}
    })
        .then(
            response => response.json().then(
                data => ({status: response.status, msg: data.msg})))
        .then(response => showMessage(response))
        .then(response => {
            if (response.status == 302)
                window.location.replace('/main_page.html')
        })
})

// change from registration mode to login mode, vice versa
// returns true if the page has changed
function changePage(page) {
    let names = document.querySelectorAll('.removed-name');
    let change = false;
    let restored = names[0].classList.contains('restored-name');
    if (restored && page == 'login') {
        names[0].classList.remove('restored-name');
        setTimeout(() => {names[1].classList.remove('restored-name')}, 50);
        change = true;
    } else if (!restored && page == 'register') {
        names[0].classList.add('restored-name');
        setTimeout(() => {names[1].classList.add('restored-name')}, 50);
        change = true;
    }
    return change;
}

// remove css animation class once animation has ended 
// for message popup
document.querySelector('.server-message')
    .addEventListener('animationend', function() {
        let serverMsg = document.querySelector('.server-message')
        serverMsg.classList.remove('show-error');
        serverMsg.innerHTML = '';
    });

// Show message returned by server 
function showMessage(response) {
    let messageDiv = document.querySelector('.server-message');
    messageDiv.style.backgroundColor =
        response.status == 400 ? '#e74c3c' : '#2ECC71';
    messageDiv.innerHTML = response.msg;
    messageDiv.classList.add('show-error');
    return response;
}

