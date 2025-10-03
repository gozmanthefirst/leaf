export const signUpErrMaps: Record<string, Record<string, string> | string> = {
  INVALID_DATA: {
    "name: Too small: expected string to have >=1 characters":
      "A name is required.",
    "email: Invalid email address": "A valid email address is required.",
    "image: Invalid URL": "A valid image URL is required.",
    "password: Too small: expected string to have >=8 characters":
      "A password is required.",
    "rememberMe: Invalid input: expected boolean, received string":
      "Remember me must be either true or false.",
    default: "Please check your input and try again.",
  },
  ACCOUNT_EXISTS: "An account with this email already exists.",
  UNPROCESSABLE_ENTITY: "Please check your input and try again.",
  TOO_MANY_REQUESTS: "Too many sign-up attempts. Please try again later.",
};

export const verifyEmailErrMaps: Record<
  string,
  Record<string, string> | string
> = {
  INVALID_DATA: "The token is invalid.",
  TOKEN_EXPIRED:
    "The token has expired. Try signing in again to get a new one.",
  FORBIDDEN: "The token is invalid.",
  NOT_FOUND: "The token is invalid.",
  TOO_MANY_REQUESTS: "Too many attempts. Please try again later.",
};

export const signInErrMaps: Record<string, Record<string, string> | string> = {
  INVALID_DATA: {
    "email: Invalid email address": "A valid email address is required.",
    "password: Too small: expected string to have >=8 characters":
      "A password is required.",
    "rememberMe: Invalid input: expected boolean, received string":
      "Remember me must be either true or false.",
    default: "Please check your input and try again.",
  },
  INVALID_EMAIL_OR_PASSWORD: "The email or password is incorrect.",
  EMAIL_NOT_VERIFIED:
    "This email isn't verified. Check your inbox for a verification email.",
  UNPROCESSABLE_ENTITY: "Please check your input and try again.",
  TOO_MANY_REQUESTS: "Too many sign-in attempts. Please try again later.",
};

export const forgotPwdErrMaps: Record<string, Record<string, string> | string> =
  {
    INVALID_DATA: "A valid email address is required.",
    UNPROCESSABLE_ENTITY: "Please check your input and try again.",
    TOO_MANY_REQUESTS: "Too many attempts. Please try again later.",
  };

export const resetPwdErrMaps: Record<string, Record<string, string> | string> =
  {
    INVALID_DATA: {
      "newPassword: Too small: expected string to have >=8 characters":
        "A new password is required.",
      "token: Too small: expected string to have >=1 characters":
        "A valid token is required.",
      "token: Invalid input: expected string, received undefined":
        "A valid token is required.",
      default: "Please check your input and try again.",
    },
    INVALID_TOKEN: "The token is invalid.",
    UNPROCESSABLE_ENTITY: "Please check your input and try again.",
    TOO_MANY_REQUESTS: "Too many attempts. Please try again later.",
  };

export const signOutErrMaps: Record<string, Record<string, string> | string> = {
  FAILED_TO_GET_SESSION: "You must be signed in to sign out.",
  UNAUTHORIZED: "You must be signed in to sign out.",
  TOO_MANY_REQUESTS: "Too many attempts. Please try again later.",
};
