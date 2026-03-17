// frontend/src/utils/stripe.ts
import { loadStripe } from "@stripe/stripe-js";

// Single Stripe instance for the entire app
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);