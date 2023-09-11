const API_BASE_URL = "https://api.nickandannabellegetmarried.com";
const SITE_BASE = "https://nickandannabellegetmarried.com";

const setError = (el, message) => {
  el.textContent = message;
  el.classList.remove("hidden");
};

const clearError = (el) => {
  el.textContent = "";
  el.classList.add("add");
};

const showSpinner = (button) => {
  console.log("showing spinner")
  button.innerHTML = '<div class="spinner"></div>';
};

const removeSpinner = (button) => {
  button.innerHTML = "Login";
};

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("submit");
  const errorMessage = document.getElementById("error-message");
  // const loadingSpinner = document.getElementById("loading-spinner");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Disable the submit button and show the loading spinner
    loginButton.disabled = true;
    // loadingSpinner.style.display = "block";

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
      // Perform validation for email (you can add more validation logic)

      if (!isValidEmail(email)) {
        setError(errorMessage, "Please provide a valid email address");
        throw new Error("INVALID_EMAIL")
      }

      showSpinner(loginButton);
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      if (response.status === 200) {
        location.href = `${SITE_BASE}/main.html`;
        // Successful login logic here
        console.log("Login successful");
        return
      } else if (response.status === 403) {
        setError(errorMessage, "Invalid Credentials");
        removeSpinner(loginButton);
      } else if (response.status === 500) {
        setError(errorMessage, "Something went wrong on our end");
        removeSpinner(loginButton);
      }
    } catch (error) {
      console.error("An error occurred:", error);
      setError(errorMessage, "Something went wrong");
      removeSpinner(loginButton);
      loginButton.disabled = false
    }
  });

  // Function to validate email format
  function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
  }
});
