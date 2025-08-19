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
    callbackUrl: "Must be a path starting with '/'",
    rememberMe: "Invalid input: expected boolean, received string",
  },
  signInValErrs: {
    email: "Invalid email address",
    password: "Too small: expected string to have >=8 characters",
    callbackUrl: "Must be a path starting with '/'",
    rememberMe: "Invalid input: expected boolean, received string",
  },
  sendVerificationEmailValErrs: {
    email: "Invalid email address",
    callbackUrl: "Must be a path starting with '/'",
  },
  invalidJwtTokenErr: {
    token: "Invalid JWT",
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
  jwt: "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Imdvem1hbnN1bmRheUBnbWFpbC5jb20iLCJpYXQiOjE3NTU1NjU2NjYsImV4cCI6MTc1NTU2OTI2Nn0.SHriShYEjHKz5aQYTfBUSJPvbzWd9aYBY_T2RI-tWyQ",
};
