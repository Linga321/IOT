const url = '.';


const auth = document.querySelector('#auth');
const username = document.querySelector('#username');
const password = document.querySelector('#password');
var Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
});
auth.addEventListener('submit', async(evt) => {
    evt.preventDefault();
    const fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "username": username.value,
            "password": password.value
        })
    };
    const response = await fetch(url + '/login', fetchOptions);
    const json = await response.json();
    if (json.success == 1) {
        Toast.fire({
            icon: 'success',
            title: json.message
        })
        window.location.href = "http://localhost:3000/index";
    } else {
        Toast.fire({
            icon: 'error',
            title: json.message
        })
    }

});