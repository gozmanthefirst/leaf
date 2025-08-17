export const notesExamples = {
  note: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "Sample note",
    content: "This is sample note content.",
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
  },
  notesValErrs: {
    title: "Too small: expected string to have >=1 characters",
    content: "Too small: expected string to have >=1 characters",
  },
};

export const authExamples = {
  signUpValErrs: {
    name: "Too small: expected string to have >=1 characters",
    email: "Invalid email address",
    image: "Invalid URL",
    password: "Too small: expected string to have >=8 characters",
    callbackUrl: "Invalid URL",
    rememberMe: "Invalid input: expected boolean, received string",
  },
  user: {
    id: "aBCDEF0gHijkLM1NO2PqrsTuVwXyzaBc",
    email: "newuser@example.com",
    name: "New User",
    image: "https://example.com/image.png",
    emailVerified: false,
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
  },
  token: "aBCDEF0gHijkLM1NO2PqrsTuVwXyzaBc",
};
