export const authExamples = {
  signUpValErrs: {
    name: "Too small: expected string to have >=1 characters",
    email: "Invalid email address",
    image: "Invalid URL",
    password: "Too small: expected string to have >=8 characters",
    rememberMe: "Invalid input: expected boolean, received string",
  },
  signInValErrs: {
    email: "Invalid email address",
    password: "Too small: expected string to have >=8 characters",
    rememberMe: "Invalid input: expected boolean, received string",
  },
  resetPwdValErrs: {
    newPassword: "Too small: expected string to have >=8 characters",
    token: "Too small: expected string to have >=1 characters",
  },
  changePwdValErrs: {
    newPassword: "Too small: expected string to have >=8 characters",
    currentPassword: "Too small: expected string to have >=8 characters",
  },
  emailValErr: {
    email: "Invalid email address",
  },
  uuidValErr: {
    id: "Invalid UUID",
  },
  jwtValErr: {
    token: "Invalid JWT",
  },
  token: "aBCDEF0gHijkLM1NO2PqrsTuVwXyzaBc",
  jwt: "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Imdvem1hbnN1bmRheUBnbWFpbC5jb20iLCJpYXQiOjE3NTU1NjU2NjYsImV4cCI6MTc1NTU2OTI2Nn0.SHriShYEjHKz5aQYTfBUSJPvbzWd9aYBY_T2RI-tWyQ",
};

export const notesExamples = {
  note: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "Sample note",
    content: "This is sample note content.",
    folderId: "123e4567-e89b-12d3-a456-426614174000",
    userId: authExamples.token,
    isFavorite: false,
    tags: ["tag1"],
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
  },
  encryptedNote: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "Sample note",
    contentEncrypted: "encryptedContent",
    contentIv: "initializationVector",
    contentTag: "authenticationTag",
    folderId: "123e4567-e89b-12d3-a456-426614174000",
    userId: authExamples.token,
    isFavorite: false,
    tags: ["tag1"],
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
  },
  createNoteValErrs: {
    title: "Too small: expected string to have >=1 characters",
    folderId: "Invalid UUID",
    isFavorite: "Invalid input: expected boolean, received string",
    tags: "Invalid input: expected array, received string",
  },
  favoriteNoteValErrs: {
    favorite: "Invalid input: expected boolean, received string",
  },
};

export const foldersExamples = {
  folder: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Sample folder",
    parentFolderId: "123e4567-e89b-12d3-a456-426614174000",
    isRoot: true,
    userId: authExamples.token,
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
  },
  createRootFolderValErrs: {
    name: "Too small: expected string to have >=1 characters",
    parentFolderId: "Invalid UUID",
    isRoot: "Invalid input: expected boolean, received string",
  },
  createFolderValErrs: {
    name: "Too small: expected string to have >=1 characters",
    parentFolderId: "Invalid UUID",
  },
  folderWithItems: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "My Folder",
    parentFolderId: "550e8400-e29b-41d4-a716-446655440001",
    isRoot: true,
    userId: "550e8400-e29b-41d4-a716-446655440002",
    createdAt: new Date(),
    updatedAt: new Date(),
    notes: [notesExamples.note],
    folders: [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "My Folder",
        parentFolderId: "550e8400-e29b-41d4-a716-446655440001",
        isRoot: false,
        userId: "550e8400-e29b-41d4-a716-446655440002",
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: [notesExamples.note],
        folders: [],
      },
    ],
  },
};

export const userExamples = {
  user: {
    id: "aBCDEF0gHijkLM1NO2PqrsTuVwXyzaBc",
    email: "newuser@example.com",
    name: "New User",
    image: "https://example.com/image.png",
    emailVerified: false,
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
  },
  updateUserValErrs: {
    name: "Too small: expected string to have >=1 characters",
    image: "Invalid URL",
  },
};
