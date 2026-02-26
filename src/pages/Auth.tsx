import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Check, Loader2, Calendar, Clock, Shield } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import SEO from "@/components/SEO";
import { pageSEO, siteConfig } from "@/lib/seo-config";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import SocialLoginButton from "@/components/auth/SocialLoginButton";

const authSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  fullName: z.string().max(100).optional(),
  username: z.string().min(3, "Username must be at least 3 characters").max(30).optional(),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const checkUsernameAvailability = async (value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", value)
        .maybeSingle();
      if (error) throw error;
      setUsernameAvailable(!data);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUsername(sanitized);
  };

  useEffect(() => {
    if (!isLogin && username.length >= 3) {
      const timer = setTimeout(() => {
        checkUsernameAvailability(username);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
    }
  }, [username, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !acceptedTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy");
      return;
    }
    if (!isLogin && usernameAvailable === false) {
      toast.error("Username is already taken");
      return;
    }
    setLoading(true);
    try {
      authSchema.parse({
        email,
        password,
        fullName: isLogin ? undefined : fullName,
        username: isLogin ? undefined : username,
      });

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        const redirectUrl = `${window.location.origin}/onboarding`;
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName.trim() || email.trim(),
              username: username.trim(),
            },
          },
        });
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Email already registered. Please sign in.");
            setIsLogin(true);
          } else {
            toast.error(error.message);
          }
          return;
        }
        if (data.user && username.trim()) {
          await supabase
            .from("profiles")
            .update({ username: username.trim(), full_name: fullName.trim() })
            .eq("user_id", data.user.id);
        }
        toast.success("Account created! Let's set up your profile.");
        navigate("/onboarding");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setPassword("");
    setUsernameAvailable(null);
    setAcceptedTerms(false);
  };

  const sellingPoints = [
    { icon: Calendar, text: "Smart scheduling that works for everyone" },
    { icon: Clock, text: "Automatic timezone detection" },
    { icon: Shield, text: "Enterprise-grade security & privacy" },
  ];

  return (
    <>
      <SEO
        title={pageSEO.auth.title}
        description={pageSEO.auth.description}
        keywords={pageSEO.auth.keywords}
        canonical={`${siteConfig.url}/auth`}
      />
      <div className="min-h-screen flex bg-gradient-subtle">
        {/* Left panel - marketing (desktop only) */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5" />
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-md space-y-8">
            <a href="/" className="inline-flex items-center gap-3">
              <img src="/bookme-logo.png" alt="BookMe.Bet" className="h-12 w-12 rounded-2xl object-cover shadow-md" />
              <span className="font-display text-2xl font-bold">BookMe.Bet</span>
            </a>
            
            <div>
              <h2 className="font-display text-3xl font-bold mb-3">
                The smartest way to schedule meetings
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Join thousands of professionals who've simplified their scheduling workflow.
              </p>
            </div>

            <div className="space-y-4">
              {sellingPoints.map((point, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <point.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{point.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <Card className="w-full max-w-md p-5 sm:p-8 animate-scale-in">
            {/* Back to home */}
            <div className="mb-4 sm:mb-6">
              <a
                href="/"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to home
              </a>
            </div>

            {/* Logo (mobile only) */}
            <div className="flex items-center justify-center mb-5 sm:mb-7 lg:hidden">
              <img
                src="/bookme-logo.png"
                alt="BookMe.Bet"
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl object-cover shadow-md"
              />
            </div>

            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                {isLogin
                  ? "Sign in to manage your scheduling"
                  : "Get started with your free account"}
              </p>
            </div>

            {/* Social Login */}
            <div className="mb-5 sm:mb-6">
              <SocialLoginButton provider="google" disabled={loading} />
            </div>

            {/* Divider */}
            <div className="relative mb-5 sm:mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {!isLogin && (
                <div className="space-y-1.5 sm:space-y-2 animate-fade-in">
                  <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    className="h-11 sm:h-12"
                  />
                </div>
              )}

              {!isLogin && (
                <div className="space-y-1.5 sm:space-y-2 animate-fade-in">
                  <Label htmlFor="username" className="text-sm">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      required={!isLogin}
                      className={`h-11 sm:h-12 pr-10 ${
                        username.length >= 3
                          ? usernameAvailable
                            ? "border-success focus-visible:ring-success"
                            : usernameAvailable === false
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                          : ""
                      }`}
                    />
                    {username.length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingUsername ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : usernameAvailable ? (
                          <Check className="w-5 h-5 text-success" />
                        ) : usernameAvailable === false ? (
                          <span className="text-xs text-destructive font-medium">Taken</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground break-all">
                    Your booking URL: {window.location.host}/book/{username || "username"}
                  </p>
                </div>
              )}

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 sm:h-12"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 sm:h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 touch-target"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {isLogin && (
                  <div className="text-right">
                    <a href="/auth/reset-password" className="text-xs sm:text-sm text-primary hover:underline">
                      Forgot password?
                    </a>
                  </div>
                )}
              </div>

              {!isLogin && password && <PasswordStrengthMeter password={password} />}

              {!isLogin && (
                <div className="flex items-start space-x-3 animate-fade-in py-1">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-0.5 h-5 w-5"
                  />
                  <label htmlFor="terms" className="text-xs sm:text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    I agree to the{" "}
                    <a href="/terms" className="text-primary hover:underline">Terms of Service</a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                  </label>
                </div>
              )}

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full h-11 sm:h-12 mt-2"
                disabled={loading || (!isLogin && (!acceptedTerms || usernameAvailable === false))}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-5 sm:mt-6 text-center space-y-3">
              <button
                onClick={toggleMode}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span className="text-primary font-medium">
                  {isLogin ? "Sign up" : "Sign in"}
                </span>
              </button>

              {isLogin && (
                <div className="pt-2 border-t border-border">
                  <a
                    href="/get-started"
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    New here? Set up your account in minutes →
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Auth;
