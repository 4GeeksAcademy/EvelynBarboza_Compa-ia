const form = document.getElementById('application-form');
const clearButton = document.getElementById('clear-form');
const formAlert = document.getElementById('form-alert');

const fields = {
  fullName: {
    element: document.getElementById('fullName'),
    error: document.getElementById('fullName-error')
  },
  email: {
    element: document.getElementById('email'),
    error: document.getElementById('email-error')
  },
  password: {
    element: document.getElementById('password'),
    error: document.getElementById('password-error')
  },
  confirmPassword: {
    element: document.getElementById('confirmPassword'),
    error: document.getElementById('confirmPassword-error')
  }
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const passwordPattern = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const fullNamePattern = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/;

const messages = {
  es: {
    fullNameRequired: 'El nombre es obligatorio. Escribe nombre y apellido para continuar.',
    fullNameShort: 'El nombre es demasiado corto. Usa al menos 5 caracteres.',
    fullNameInvalid:
      'El nombre solo puede incluir letras, espacios, apóstrofes o guiones. Elimina números y símbolos no permitidos.',
    emailRequired: 'El correo es obligatorio. Introduce un email de contacto válido.',
    emailInvalid: 'Formato de correo inválido. Revisa que tenga usuario, arroba y dominio.',
    passwordRequired: 'La contraseña es obligatoria. Crea una contraseña segura para continuar.',
    passwordInvalid: 'Contraseña insegura. Debe tener 8+ caracteres, 1 mayúscula y 1 número.',
    confirmRequired: 'Debes confirmar la contraseña. Repite la misma contraseña del campo anterior.',
    confirmMismatch: 'Las contraseñas no coinciden. Vuelve a escribir ambas contraseñas exactamente igual.',
    formError: 'Hay errores en el formulario. Revisa los mensajes de cada campo para corregirlos.',
    formSuccess: 'Registro enviado correctamente. Ya puedes continuar con el siguiente paso.'
  },
  en: {
    fullNameRequired: 'Full name is required. Enter first and last name to continue.',
    fullNameShort: 'The name is too short. Use at least 5 characters.',
    fullNameInvalid:
      'The name can only include letters, spaces, apostrophes, or hyphens. Remove numbers and unsupported symbols.',
    emailRequired: 'Email is required. Enter a valid contact email.',
    emailInvalid: 'Invalid email format. Check user, @, and domain.',
    passwordRequired: 'Password is required. Create a secure password to continue.',
    passwordInvalid: 'Weak password. It must have 8+ characters, 1 uppercase letter, and 1 number.',
    confirmRequired: 'Please confirm your password. Repeat the same password from above.',
    confirmMismatch: 'Passwords do not match. Re-enter both passwords exactly the same.',
    formError: 'There are errors in the form. Review each field message and fix them.',
    formSuccess: 'Registration submitted successfully. You can continue to the next step.'
  }
};

function getLanguage() {
  return localStorage.getItem('trackflow-lang') === 'en' ? 'en' : 'es';
}

function t(key) {
  return messages[getLanguage()][key] || messages.es[key] || key;
}

function setFieldError(fieldKey, message) {
  const field = fields[fieldKey];
  field.error.textContent = message;
  field.element.setAttribute('aria-invalid', 'true');
  field.element.classList.add('border-ember', 'ring-2', 'ring-ember/30');
}

function clearFieldError(fieldKey) {
  const field = fields[fieldKey];
  field.error.textContent = '';
  field.element.setAttribute('aria-invalid', 'false');
  field.element.classList.remove('border-ember', 'ring-2', 'ring-ember/30');
}

function showFormAlert(message, isError = true) {
  formAlert.classList.remove('hidden');
  formAlert.textContent = message;

  if (isError) {
    formAlert.classList.remove('border-secondary/40', 'bg-secondary/10');
    formAlert.classList.add('border-ember/40', 'bg-ember/10');
  } else {
    formAlert.classList.remove('border-ember/40', 'bg-ember/10');
    formAlert.classList.add('border-secondary/40', 'bg-secondary/10');
  }

  formAlert.focus();
}

function hideFormAlert() {
  formAlert.classList.add('hidden');
  formAlert.textContent = '';
}

function validateField(fieldKey) {
  const value = fields[fieldKey].element.value.trim();

  switch (fieldKey) {
    case 'fullName':
      if (!value) {
        setFieldError(
          fieldKey,
          t('fullNameRequired')
        );
        return false;
      }

      if (value.length < 5) {
        setFieldError(
          fieldKey,
          t('fullNameShort')
        );
        return false;
      }

      if (!fullNamePattern.test(value)) {
        setFieldError(
          fieldKey,
          t('fullNameInvalid')
        );
        return false;
      }
      break;

    case 'email':
      if (!value) {
        setFieldError(
          fieldKey,
          t('emailRequired')
        );
        return false;
      }

      if (!emailPattern.test(value)) {
        setFieldError(
          fieldKey,
          t('emailInvalid')
        );
        return false;
      }
      break;

    case 'password':
      if (!value) {
        setFieldError(
          fieldKey,
          t('passwordRequired')
        );
        return false;
      }

      if (!passwordPattern.test(value)) {
        setFieldError(
          fieldKey,
          t('passwordInvalid')
        );
        return false;
      }
      break;

    case 'confirmPassword':
      if (!value) {
        setFieldError(
          fieldKey,
          t('confirmRequired')
        );
        return false;
      }

      if (value !== fields.password.element.value) {
        setFieldError(
          fieldKey,
          t('confirmMismatch')
        );
        return false;
      }
      break;

    default:
      return true;
  }

  clearFieldError(fieldKey);
  return true;
}

function validateForm() {
  const results = [
    validateField('fullName'),
    validateField('email'),
    validateField('password'),
    validateField('confirmPassword')
  ];

  return results.every(Boolean);
}

Object.keys(fields).forEach((fieldKey) => {
  fields[fieldKey].element.addEventListener('input', () => {
    validateField(fieldKey);

    if (fieldKey === 'password' && fields.confirmPassword.element.value) {
      validateField('confirmPassword');
    }
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  hideFormAlert();

  const isValid = validateForm();

  if (!isValid) {
    showFormAlert(
      t('formError'),
      true
    );

    const firstInvalidField = Object.values(fields).find(
      (field) => field.element.getAttribute('aria-invalid') === 'true'
    );

    if (firstInvalidField) {
      firstInvalidField.element.focus();
    }

    return;
  }

  showFormAlert(t('formSuccess'), false);
  form.reset();

  Object.keys(fields).forEach((fieldKey) => {
    clearFieldError(fieldKey);
  });

  fields.fullName.element.focus();
});

clearButton.addEventListener('click', () => {
  form.reset();
  hideFormAlert();

  Object.keys(fields).forEach((fieldKey) => {
    clearFieldError(fieldKey);
  });

  fields.fullName.element.focus();
});
