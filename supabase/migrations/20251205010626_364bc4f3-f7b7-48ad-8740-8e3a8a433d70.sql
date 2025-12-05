-- Add subscription plan field to profiles
ALTER TABLE public.profiles 
ADD COLUMN subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'enterprise'));

-- Add index for plan queries
CREATE INDEX idx_profiles_subscription_plan ON public.profiles(subscription_plan);