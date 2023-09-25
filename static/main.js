const API_BASE_URL = "https://api.nickandannabellegetmarried.com";
// header/scrolling behavior
const header = document.getElementById("header");
const headerText = header.querySelector("div");
const hero = document.querySelector("#hero");

const heroOptions = {
  root: null,
  threshold: 0.1,
  rootMargin: "0px",
};

const heroObserver = new IntersectionObserver(function (entries, _) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      headerText.classList.remove("hidden");
      header.style.borderBottom = "1px solid black";
      header.style.opacity = 1
    } else {
      headerText.classList.add("hidden");
      header.style.borderBottom = "none";
      header.style.opacity = 0
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
  toggleMenu();
});

// rsvp

const showSpinner = (button) => {
  button.disabled = true;
  console.log("showing spinner");
  button.innerHTML = '<div class="spinner"></div>';
};

const removeSpinner = (button) => {
  button.disabled = false;
  button.innerHTML = "Login";
};
const setError = (el, message) => {
  el.textContent = message;
  el.classList.remove("hidden");
};

const clearError = (el) => {
  el.textContent = "";
  el.classList.add("add");
};
// const rsvpForm = document.getElementById("rsvp");
// const forms = Array.from(document.querySelectorAll(".guest-form"));
// const submitBtn = document.getElementById("submit");
// rsvpForm.addEventListener("submit", async (e) => {
//   e.preventDefault();
//   // get form data
//   const formData = forms.reduce((acc, curr) => {
//     const guestId = curr.querySelector("h4").dataset.guestId;
//     const events = Array.from(curr.querySelectorAll("h5"));
//     const rsvps = Array.from(curr.querySelectorAll("select")).map((sel) => {
//       return sel.value === "1" ? true : false;
//     });
//     const evWithRsvp = events.map((event, idx) => ({
//       event: event.dataset.eventId,
//       rsvp: rsvps[idx],
//     }));
//     const dietaryRestrictions = curr.querySelector("textarea").value || "";
//
//     return [
//       ...acc,
//       {
//         id: Number(guestId), // hack because this is what lambda is expected
//         events: evWithRsvp,
//         dietary_restrictions: dietaryRestrictions,
//       },
//     ];
//   }, []);
//
//   showSpinner(submitBtn);
//   // make rsvp request
//   const response = await fetch(`${API_BASE_URL}/rsvp`, {
//     method: "POST",
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(formData),
//   });
//   if (response.status === 200) {
//     // successful rsvp
//     console.log("rsvp successfull");
//     showSuccessMessage(document.querySelector('.rsvp-card'))
//     return;
//   } else if (response.status === 400) {
//     setError(errorMessage, "Invalid Request");
//     removeSpinner(loginButton);
//   } else if (response.status === 500) {
//     setError(errorMessage, "Something went wrong on our end");
//     removeSpinner(loginButton);
//   }
// });
//
// const showSuccessMessage = (container) => {
//   debugger
//   container.innerHTML = `
//     <div id="success"> 
//         <h4>
//             Response recorded! We are looking forward to seeing you :) 
//         </h4>
//     </div>
// `;
// };
