// Import Firebase modular SDK
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDlFYzg5Te2jz-kVKXd0yGYlJkMwU9fxss",
  authDomain: "ju-civil-a-martian.firebaseapp.com",
  projectId: "ju-civil-a-martian",
  storageBucket: "ju-civil-a-martian.firebasestorage.app",
  messagingSenderId: "247448010406",
  appId: "1:247448010406:web:a2efa79a4080513cc87e67",
  measurementId: "G-BXYMLKE395"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
});
document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');

// Tab switching
const authTabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('.auth-form');
authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    authTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    authForms.forEach(form => form.classList.remove('active'));
    document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
  });
});

// Password toggle
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.parentElement.querySelector('input');
    const icon = btn.querySelector('.material-icons');
    if (input.type === 'password') {
      input.type = 'text';
      icon.textContent = 'visibility';
    } else {
      input.type = 'password';
      icon.textContent = 'visibility_off';
    }
  });
});

// Password Length Validator
const registerPassword = document.getElementById('registerPassword');
registerPassword.addEventListener('input', function() {
  const errorMessage = document.getElementById('password-error');
  const password = registerPassword.value;
  if (password && (password.length < 6 || password.length > 16)) {
    errorMessage.style.display = 'block';
    registerPassword.style.borderColor = 'red';
  } else {
    errorMessage.style.display = 'none';
    registerPassword.style.borderColor = '';
  }
});

// Show/hide loading overlay
function showLoading() { document.getElementById('loadingOverlay').classList.add('active'); }
function hideLoading() { document.getElementById('loadingOverlay').classList.remove('active'); }

// Show error message
function showErrorMessage(message) {
  const errorAlert = document.getElementById('error-alert');
  const backdrop = document.getElementById('backdrop');
  errorAlert.querySelector('.alert-message').textContent = message;
  backdrop.classList.add('active');
  errorAlert.classList.add('show');
  setTimeout(() => {
    errorAlert.classList.remove('show');
    setTimeout(() => { backdrop.classList.remove('active'); }, 500);
  }, 3500);
}

// Show success modal
function showSuccessModal(message, redirectUrl) {
  document.getElementById('successMessage').textContent = message;
  document.getElementById('successModal').classList.add('active');
  setTimeout(() => { window.location.href = redirectUrl; }, 2000);
}
document.getElementById('successDoneBtn').onclick = () => {
  window.location.href = '/landing/landing.html';
};

// Login
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const roll = document.getElementById('loginRoll').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!/^\d{12}$/.test(roll)) {
    showErrorMessage('Roll number must be 12 digits.');
    return;
  }
  showLoading();
  try {
    const email = `${roll}@juce.in`;
    await setPersistence(auth, browserLocalPersistence); // Always persistent for now
    await signInWithEmailAndPassword(auth, email, password);
    // Fetch role from Firestore
    const userDoc = await getDoc(doc(db, "users", roll));
    const role = userDoc.exists() && userDoc.data().role ? userDoc.data().role : 'student';
    hideLoading();
    if (role === 'admin') {
      showSuccessModal('Welcome, Admin!', '/admin.html');
    } else {
      showSuccessModal('Login successful!', '/landing/landing.html');
    }
  } catch (err) {
    hideLoading();
    showErrorMessage('Invalid roll number or password.');
  }
});

// Register
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('registerName').value.trim();
  const roll = document.getElementById('registerRoll').value.trim();
  const subsection = document.getElementById('registerSubsection').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  if (!/^\d{12}$/.test(roll)) { showErrorMessage('Roll number must be 12 digits.'); return; }
  if (!name) { showErrorMessage('Name is required.'); return; }
  if (!subsection) { showErrorMessage('Please select subsection.'); return; }
  if (password.length < 6 || password.length > 16) { showErrorMessage('Password must be 6-16 characters.'); return; }
  if (password !== confirmPassword) { showErrorMessage('Passwords do not match.'); return; }
  showLoading();
  try {
    const email = `${roll}@juce.in`;
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    // Save user info and role (student) in Firestore
    await setDoc(doc(db, "users", roll), {
      name,
      subsection,
      role: 'student'
    });
    hideLoading();
    showSuccessModal('Registration successful!', '/landing/landing.html');
  } catch (err) {
    hideLoading();
    showErrorMessage('Registration failed: ' + (err.message || ''));
  }
});
