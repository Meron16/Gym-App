export default () => ({
  port: parseInt(process.env.PORT ?? "3001", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwt: {
    secret: process.env.JWT_SECRET || "dev-only-change-me-in-production-min-32-chars!!!!",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  },
  auth: {
    devAllowPlaceholder: process.env.AUTH_DEV_ALLOW_PLACEHOLDER_TOKEN === "true",
  },
  booking: {
    requireEntitlement: process.env.BOOKING_REQUIRE_ENTITLEMENT === "true",
    slotCapacity: parseInt(process.env.BOOKING_SLOT_CAPACITY ?? "10", 10),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    successUrl: process.env.STRIPE_SUCCESS_URL ?? "https://example.com/success",
    cancelUrl: process.env.STRIPE_CANCEL_URL ?? "https://example.com/cancel",
    checkoutPlaceholderUrl:
      process.env.STRIPE_CHECKOUT_PLACEHOLDER_URL ?? "https://example.com/stripe-checkout-placeholder",
  },
});
