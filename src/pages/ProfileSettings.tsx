import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile, useCheckUsernameAvailability } from "@/hooks/useProfile";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Link, Copy, Check, ExternalLink, Globe, Share2, Trash2, Loader2 } from "lucide-react";
import TimezoneSelector from "@/components/TimezoneSelector";
import { getLocalTimezone } from "@/lib/timezones";
import ShareModal from "@/components/ShareModal";
import { SkeletonProfile } from "@/components/ui/skeleton-card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(100, "Name is too long"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed")
    .optional()
    .or(z.literal("")),
  timezone: z.string().min(1, "Timezone is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfileSettings = () => {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const checkUsername = useCheckUsernameAvailability();
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      username: "",
      timezone: getLocalTimezone(),
    },
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || "",
        username: profile.username || "",
        timezone: profile.timezone || getLocalTimezone(),
      });
    }
  }, [profile, form]);

  // Debounced username availability check
  const watchedUsername = form.watch("username");
  useEffect(() => {
    if (watchedUsername && watchedUsername.length >= 3 && watchedUsername !== profile?.username) {
      const timer = setTimeout(async () => {
        const result = await checkUsername.mutateAsync(watchedUsername);
        setUsernameAvailable(result);
      }, 500);
      return () => clearTimeout(timer);
    } else if (watchedUsername === profile?.username) {
      setUsernameAvailable(true);
    } else {
      setUsernameAvailable(null);
    }
  }, [watchedUsername, profile?.username]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (usernameAvailable === false) {
      toast.error("Username is not available");
      return;
    }

    await updateProfile.mutateAsync({
      full_name: data.full_name,
      username: data.username || null,
      timezone: data.timezone,
    });
  };

  const copyBookingLink = () => {
    const username = form.getValues("username");
    if (!username) return;
    
    const url = `${window.location.origin}/book/${username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Booking link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      
      if (error) throw error;
      
      toast.success("Account deleted successfully");
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setDeletingAccount(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <div className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-bottom-nav">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Profile Settings</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Manage your profile and booking page settings
              </p>
            </div>
            <SkeletonProfile />
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const currentUsername = form.watch("username");
  const bookingUrl = `${window.location.origin}/book/${currentUsername || "yourname"}`;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-bottom-nav">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your profile and booking page settings
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              {/* Profile Info */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  Profile Information
                </h2>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} className="h-11 sm:h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="yourname"
                              {...field}
                              onChange={(e) => {
                                const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                                field.onChange(sanitized);
                              }}
                              className="pr-10 h-11 sm:h-10"
                            />
                            {checkUsername.isPending && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                            {!checkUsername.isPending && field.value && field.value.length >= 3 && usernameAvailable !== null && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {usernameAvailable ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <span className="text-xs text-destructive">Taken</span>
                                )}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs sm:text-sm break-all">
                          Your booking URL: {window.location.origin}/book/{field.value || "yourname"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="mt-6 w-full sm:w-auto"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </Card>

              {/* Timezone Settings */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                  Timezone
                </h2>

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Timezone</FormLabel>
                      <FormControl>
                        <TimezoneSelector
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">
                        All your availability and booking times will be displayed in this timezone.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  variant="hero"
                  className="mt-6 w-full sm:w-auto"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? "Saving..." : "Save Timezone"}
                </Button>
              </Card>
            </form>
          </Form>

          {/* Booking Link */}
          {currentUsername && (
            <Card className="p-4 sm:p-6 mt-4 sm:mt-6">
              <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                <Link className="w-4 h-4 sm:w-5 sm:h-5" />
                Your Booking Link
              </h2>

              {/* Mobile: Stacked layout */}
              <div className="space-y-3">
                <div className="bg-muted rounded-lg px-3 sm:px-4 py-3 font-mono text-xs sm:text-sm break-all">
                  {window.location.origin}/book/{currentUsername}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyBookingLink}
                    className="flex-1 sm:flex-none h-10"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    <span className="sm:hidden">Copy</span>
                    <span className="hidden sm:inline">Copy Link</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/book/${currentUsername}`, "_blank")}
                    className="flex-1 sm:flex-none h-10"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    <span className="sm:hidden">Open</span>
                    <span className="hidden sm:inline">Open Link</span>
                  </Button>
                </div>

                <Button
                  variant="hero"
                  className="w-full h-11 sm:h-10"
                  onClick={() => setShowShareModal(true)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground mt-4">
                Share this link with others so they can book meetings with you.
              </p>
            </Card>
          )}

          {/* Danger Zone - Account Deletion */}
          <Card className="p-4 sm:p-6 mt-4 sm:mt-6 border-destructive/50">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-destructive flex items-center gap-2">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              Danger Zone
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. This will permanently delete your profile, all your event types, bookings, and availability settings.
            </p>
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Your profile and settings</li>
                      <li>All your event types</li>
                      <li>All your bookings (past and upcoming)</li>
                      <li>Your availability settings</li>
                      <li>Any active subscriptions will be cancelled</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingAccount}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletingAccount ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Yes, delete my account"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        </div>
      </div>

      {currentUsername && (
        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          username={currentUsername}
          fullName={form.watch("full_name")}
        />
      )}

      <BottomNavigation />
    </div>
  );
};

export default ProfileSettings;
