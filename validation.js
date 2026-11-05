const form = document.getElementById('application-form');
const clearButton = document.getElementById('clear-form');
const formAlert = document.getElementById('form-alert');
const submitButton = form.querySelector('[type="submit"]');

const fields = {
  fullName: {
    element: document.getElementById('fullName'),
    error: document.getElementById('fullName-error')
  },
  email: {
    element: document.getElementById('email'),
    error: document.getElementById('email-error')
  }
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const fullNamePattern = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/;
const messages = {
  es: {
    fullNameInvalid: 'Escribe nombre y apellido con al menos 5 caracteres, usando letras, espacios, apostrofes o guiones.',
    emailInvalid: 'Introduce un email de contacto valido.',
    formError: 'Revisa los campos indicados antes de enviar.',
    formSuccess: 'Consulta recibida. El equipo comercial podra contactarte. No se ha creado una cuenta de empleado.',
    serverError: 'No se pudo enviar la consulta. Intentalo de nuevo.'
  },
  en: {
    fullNameInvalid: 'Enter a full name of at least 5 characters using letters, spaces, apostrophes, or hyphens.',
    emailInvalid: 'Enter a valid contact email.',
    formError: 'Review the highlighted fields before submitting.',
    formSuccess: 'Inquiry received. Our business team can contact you. No employee account was created.',
    serverError: 'Could not send your inquiry. Please try again.'
  }
};

function t(key) {
  const language = localStorage.getItem('trackflow-lang') === 'en' ? 'en' : 'es';
  return messages[language][key];
}

function clearFieldError(key) {
  fields[key].error.textContent = '';
  fields[key].element.setAttribute('aria-invalid', 'false');
}

function validateField(key) {
  const field = fields[key];
  const value = field.element.value.trim();
  const valid = key === 'fullName'
    ? value.length >= 5 && value.length <= 200 && fullNamePattern.test(value)
    : value.length <= 254 && emailPattern.test(value);
  field.error.textContent = valid ? '' : t(`${key}Invalid`);
  field.element.setAttribute('aria-invalid', String(!valid));
  return valid;
}

function hideFormAlert() {
  formAlert.classList.add('hidden');
  formAlert.textContent = '';
}

function showFormAlert(message, isError) {
  formAlert.classList.remove('hidden');
  formAlert.classList.toggle('border-ember/40', isError);
  formAlert.classList.toggle('bg-ember/10', isError);
  formAlert.classList.toggle('border-secondary/40', !isError);
  formAlert.classList.toggle('bg-secondary/10', !isError);
  formAlert.textContent = message;
  formAlert.focus();
}

Object.keys(fields).forEach((key) => {
  fields[key].element.addEventListener('input', () => validateField(key));
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitButton.disabled) return;
  hideFormAlert();
  const valid = Object.keys(fields).map(validateField).every(Boolean);
  if (!valid) {
    showFormAlert(t('formError'), true);
    Object.values(fields).find((field) => field.element.getAttribute('aria-invalid') === 'true').element.focus();
    return;
  }

  submitButton.disabled = true;
  clearButton.disabled = true;
  try {
    const response = await fetch('/api/commercial-inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fields.fullName.element.value.trim(),
        email: fields.email.element.value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        inquiry: document.getElementById('inquiry').value.trim()
      })
    });
    const data = await response.json();
    if (!response.ok || response.status !== 201 || !Number.isInteger(data.id)) {
      throw new Error(t('serverError'));
    }
    form.reset();
    Object.keys(fields).forEach(clearFieldError);
    showFormAlert(t('formSuccess'), false);
  } catch {
    showFormAlert(t('serverError'), true);
  } finally {
    submitButton.disabled = false;
    clearButton.disabled = false;
  }
});

clearButton.addEventListener('click', () => {
  form.reset();
  hideFormAlert();
  Object.keys(fields).forEach(clearFieldError);
  fields.fullName.element.focus();
});
