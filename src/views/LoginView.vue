<script setup>
// ref is used to create reactive variables in Vue.
// When the value changes, the page updates automatically.
import { ref } from 'vue'

// useRouter gives this component access to Vue Router.
// We need it because, after a successful login,
// the user should be redirected from /login to the home page.
import { useRouter } from 'vue-router'

// Create the router object.
// Later we can use router.push('/') to navigate to another page.
const router = useRouter()

// Store the username entered by the administrator.
const username = ref('')

// Store the password entered by the administrator.
const password = ref('')

// Store an error message.
// It stays empty unless the login details are incorrect.
const errorMessage = ref('')

// This function runs when the login form is submitted.
const login = () => {
  // For Iteration 2, we use one simple administrator account.
  // This keeps the authentication feature simple for the project demo.
  //
  // Username: admin
  // Password: agefriendly2026
  //
  // Later, this can be replaced with backend authentication
  // if stronger security is required.
  if (
    username.value === 'admin' &&
    password.value === '123456'
  ) {
    // Save a simple login flag in the browser's localStorage.
    //
    // localStorage keeps the value even if the page is refreshed.
    // The router will later check this value to decide whether
    // the administrator is allowed to access protected pages.
    localStorage.setItem(
      'ageFriendlyAdminLoggedIn',
      'true',
    )

    // =========================
    // PAGE NAVIGATION
    // =========================
    //
    // router.push('/') tells Vue Router to navigate
    // from the current page (/login)
    // to the home page (/).
    //
    // This does NOT reload the whole website.
    // Vue Router changes the displayed page inside the SPA.
    router.push('/')

    // Stop the function here because login was successful.
    return
  }

  // If the username or password is incorrect,
  // do not navigate anywhere.
  // Instead, show an error message on the login page.
  errorMessage.value =
    'Incorrect username or password.'
}
</script>

<template>
  <!--
    Main login page container.
    This page will be displayed when the URL is /login.
  -->
  <div class="login-page">

    <!-- Login card -->
    <div class="login-card">

      <!-- Simple Age Friendly Australia logo -->
      <div class="login-logo">
        AF
      </div>

      <h1>
        Age Friendly Australia
      </h1>

      <p class="login-description">
        Administrator access
      </p>

      <!--
        @submit.prevent="login"

        @submit:
        Run the login() function when the form is submitted.

        .prevent:
        Prevent the browser's normal form submission behaviour.
        Without this, the browser may refresh the whole page.

        This lets Vue handle the login inside the SPA.
      -->
      <form @submit.prevent="login">

        <!-- Username field -->
        <label for="username">
          Username
        </label>

        <input
          id="username"
          v-model="username"
          type="text"
          autocomplete="username"
          required
        />

        <!--
          v-model="username"

          This creates two-way binding.

          When the administrator types into this input,
          username.value is automatically updated.
        -->

        <!-- Password field -->
        <label for="password">
          Password
        </label>

        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />

        <!--
          Only display this paragraph when
          errorMessage contains some text.
        -->
        <p
          v-if="errorMessage"
          class="error-message"
        >
          {{ errorMessage }}
        </p>

        <!--
          type="submit" triggers the form's submit event,
          which then runs login().
        -->
        <button type="submit">
          Sign in
        </button>

      </form>
    </div>
  </div>
</template>

<style scoped>
/*
  scoped means these styles only apply
  to this LoginView component.
*/

.login-page {
  min-height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 24px;

  background: #f5f7f6;
}

.login-card {
  width: 100%;
  max-width: 440px;

  padding: 40px;

  background: white;

  border-radius: 16px;

  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.08);
}

.login-logo {
  width: 60px;
  height: 60px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 20px;

  border-radius: 12px;

  background: #205c46;
  color: white;

  font-size: 24px;
  font-weight: 700;
}

h1 {
  margin-bottom: 8px;
}

.login-description {
  margin-bottom: 28px;

  color: #5f6b65;
}

form {
  display: flex;
  flex-direction: column;

  gap: 10px;
}

label {
  margin-top: 8px;

  font-weight: 600;
}

input {
  padding: 14px;

  border: 1px solid #b8c2bd;
  border-radius: 8px;

  font-size: 16px;
}

button {
  margin-top: 18px;

  padding: 14px;

  border: 0;
  border-radius: 8px;

  background: #205c46;
  color: white;

  font-size: 17px;
  font-weight: 600;

  cursor: pointer;
}

button:hover {
  opacity: 0.9;
}

.error-message {
  margin: 8px 0 0;

  color: #b42318;
}
</style>