const dia = document.querySelector('#dia')
const data = new Date();

dia.innerHTML = `${data.getDate()} / 0${data.getMonth() + 1} / ${data.getFullYear()}`;