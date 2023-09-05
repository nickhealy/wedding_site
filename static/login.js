const API_BASE_URL = "https://k8eqcw1zc9.execute-api.eu-west-2.amazonaws.com";

const setError = (el, message) => {
  el.textContent = message;
  el.classList.remove("hidden")
};

const clearError = (el) => {
  el.textContent = "";
  el.classList.add("add")
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
        console.error("INVALID_EMAIL")
        return;
      }

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      if (response.status === 200) {
        // Successful login logic here
        console.log("Login successful");
      } else if (response.status === 403) {
        setError(errorMessage, "Invalid Credentials");
      } else if (response.status === 500) {
        setError(errorMessage, "Something went wrong on our end");
      }
    } catch (error) {
      console.error("An error occurred:", error);
      setError(errorMessage, "Something went wrong");
    } finally {
      // Re-enable the submit button and hide the loading spinner
      loginButton.disabled = false;
      // loadingSpinner.style.display = "none";
    }
  });

  // Function to validate email format
  function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
  }
});
