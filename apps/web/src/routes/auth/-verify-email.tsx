import z from "zod";

const _SearchSchema = z.object({
  token: z.string().trim().catch(""),
});

// export const Route = createFileRoute("/auth/verify-email")({
//   validateSearch: zodValidator(SearchSchema),
//   beforeLoad: async ({ search }) => {
//     try {
//       await $verifyEmail({ data: { token: search.token } });
//     } catch (error) {
//       const apiError = apiErrorHandler(error, {
//         defaultMessage: "An error occurred while verifying the email.",
//         errorMapping: verifyEmailErrMaps,
//       });

//       throw redirect({
//         to: "/auth/sign-in",
//         search: {
//           error: apiError.details,
//         },
//       });
//     }

//     throw redirect({
//       to: "/auth/sign-in",
//       search: {
//         success: "Email verified successfully! You can now sign in.",
//       },
//     });
//   },
// });
