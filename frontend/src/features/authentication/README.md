# Authentication Feature

Identity: Access Gateway.

## Architecture Contract

1. Folder structure: standard feature folders.
2. Component hierarchy: `AuthLayout -> LoginPage/ForgotPasswordPage/VerifyOtpPage/ResetPasswordPage -> AuthForm sections`.
3. Layout architecture: secure, focused auth shell with government branding and minimal distractions.
4. State management: per-form state, OTP state, reset token state, and auth error state.
5. API layer: `authApi` wraps login, logout, register, OTP, forgot, and reset endpoints only.
6. Hooks: `useLogin`, `useForgotPassword`, `useVerifyOtp`, `useResetPassword`, `useAuthRedirect`.
7. Types: `AuthUser`, `LoginPayload`, `OtpPayload`, `ResetPasswordPayload`, `AuthError`.
8. Utilities: token storage adapter, password strength labels, auth error normalization.
9. Responsive strategy: one-column auth card on mobile, brand/support area on desktop.
10. Reusable components: shared `Button`, `Input`, `Toast`, `Loader`, `PasswordField`.
11. Performance: minimal initial bundle, lazy password rules, no dashboard code in auth route.
12. Scalability: supports future MFA providers through auth strategy adapters.
