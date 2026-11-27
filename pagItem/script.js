const menu = document.getElementById("menu-principal");
let ultimoScrollY = window.scrollY;

window.addEventListener("scroll", () => {
  const atualScrollY = window.scrollY;
  const diferenca = atualScrollY - ultimoScrollY;

  if (atualScrollY <= 50) {
    menu.classList.remove("header--escondido");
  } else if (diferenca > 10) {
    menu.classList.add("header--escondido");
  } else if (diferenca < -20) {
    menu.classList.remove("header--escondido");
  }

  ultimoScrollY = atualScrollY;
});
