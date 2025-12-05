-- Add Stripe customer ID to profiles for subscription management
ALTER TABLE public.profiles 
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT;