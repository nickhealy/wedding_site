// header/scrolling behavior
const header = document.getElementById("header");
const headerText = header.querySelector("h1");
const hero = document.querySelector("#hero");

const heroOptions = {
  root: null,
  threshold: 0.1,
  rootMargin: "0px",
};

const heroObserver = new IntersectionObserver(function(entries, _) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      headerText.classList.remove("hidden");
      header.style.borderBottom = "1px solid black";
    } else {
      headerText.classList.add("hidden");
      header.style.borderBottom = "none";
    }
  });
}, heroOptions);

heroObserver.observe(hero);

// hamburger functionality
let isMenuOpen = false;
const hamburger = document.getElementById("hamburger");
const menu = document.getElementById("menu");

const menuItems = Array.from(document.querySelectorAll(".menu-target"));
const createMenuHTML = () => {
  const menuInnerHtml = `
  <div>
    ${menuItems.reduce(
    (acc, { id, dataset: { sectionId } }) =>
      acc +
      `<a href="#${id}"onclick="toggleMenu()">${sectionId.toUpperCase()}</a>`,
    ""
  )}
</div>
`;
  return menuInnerHtml;
};

menu.innerHTML = createMenuHTML();

const toggleMenu = () => {
  if (isMenuOpen) {
    // close menu
    hamburger.classList.remove("close");
    menu.classList.add("closed");
  } else {
    // open menu
    hamburger.classList.add("close");
    menu.classList.remove("closed");
  }
  isMenuOpen = !isMenuOpen;
};
hamburger.addEventListener("click", (e) => {
  console.log("menu clicked");
  e.preventDefault();
  toggleMenu()
});
