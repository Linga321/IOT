const url = '.';
const register = document.querySelector('#register_user');
const fullname = document.querySelector('#fullname');
const username = document.querySelector('#username');
const pw = document.querySelector('#pw');
const cpw = document.querySelector('#cpw');
const agreeTerms = document.querySelector('#agreeTerms');
var Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
});
const form_clear = () => {
    fullname.value = '';
    username.value = '';
    pw.value = '';
    cpw.value = '';
    agreeTerms.removeAttr('checked');
}


register.addEventListener('submit', async (evt) => {
    evt.preventDefault();    
    if (pw.value == cpw.value) {
        if (agreeTerms.checked) {
          const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
              },
            body: JSON.stringify({
                "username": username.value,
                "fullname": fullname.value,
                "password": pw.value
              })
          };
          const response = await fetch(url + '/register', fetchOptions);
          const json = await response.json();
          if (json.success == 1) {
            Toast.fire({
              icon: 'success',
              title: json.message
            })
          }
          else {
            Toast.fire({
              icon: 'error',
              title: json.message
            })
          }
          form_clear();
        }
        else {
          Toast.fire({
            icon: 'warning',
            title: 'Please agree the Terms'
          })
        }
      }
      else {
        Toast.fire({
          icon: 'error',
          title: 'Password is not matched'
        })
      }
});