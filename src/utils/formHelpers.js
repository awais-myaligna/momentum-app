// Returns the error message for a Formik field only once it has been
// touched, so validation doesn't flash red before the user interacts.
export const validationErrorFor = (formik, field) => (formik.touched[field] ? formik.errors[field] : undefined);
