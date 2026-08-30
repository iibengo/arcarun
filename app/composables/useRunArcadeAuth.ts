/* ============================================================================
   RUN·ARCADE — Autenticación
   ----------------------------------------------------------------------------
   Parche temporal INTENCIONAL: la contraseña queda hardcodeada en cliente
   (decisión del usuario, FR-012). No cambia el mecanismo actual.
   ============================================================================ */

export function useRunArcadeAuth() {
  const isAuthenticated = ref(false)
  const password = ref('')
  const errorMessage = ref('')

  function checkPassword() {
    if (password.value === 'Farah') {
      isAuthenticated.value = true
      errorMessage.value = ''
    } else {
      errorMessage.value = 'Contraseña incorrecta'
    }
  }

  return { isAuthenticated, password, errorMessage, checkPassword }
}
