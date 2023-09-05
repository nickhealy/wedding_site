// header/scrolling behavior
const header = document.getElementById("header");
const headerText = header.querySelector("h1");
const hero = document.querySelector("#hero");

// Options for this observer
const heroOptions = {
  root: null,
  threshold: 0.1,
  rootMargin: "0px"
};

// Observer
const heroObserver = new IntersectionObserver(function(entries, _ ) {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      headerText.classList.remove("hidden");
        header.style.borderBottom = "1px solid black"
    } else {
      headerText.classList.add("hidden");
        header.style.borderBottom = "none"
    }
  });
}, heroOptions);

// Which observes
heroObserver.observe(hero);
