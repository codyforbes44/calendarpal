import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";

const appealSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address").max(255),
  reason: z
    .string()
    .min(20, "Please provide more details (at least 20 characters)")
    .max(1000, "Reason must be less than 1000 characters"),
});

type AppealFormData = z.infer<typeof appealSchema>;

interface AppealFormProps {
  countryCode?: string;
}

const AppealForm = ({ countryCode }: AppealFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error" | "exists">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<AppealFormData>({
    resolver: zodResolver(appealSchema),
    defaultValues: {
      fullName: "",
      email: "",
      reason: "",
    },
  });

  const onSubmit = async (data: AppealFormData) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const { data: response, error } = await supabase.functions.invoke("geo-appeal", {
        body: {
          action: "submit",
          fullName: data.fullName,
          email: data.email,
          countryCode: countryCode || "unknown",
          reason: data.reason,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (response?.existingAppeal) {
        setSubmitStatus("exists");
        setErrorMessage(response.error);
      } else if (response?.success) {
        setSubmitStatus("success");
      } else {
        throw new Error(response?.error || "Failed to submit appeal");
      }
    } catch (error: any) {
      console.error("Appeal submission error:", error);
      setSubmitStatus("error");
      setErrorMessage(error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === "success") {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Appeal Submitted</h3>
          <p className="text-sm text-muted-foreground mt-1">
            We've sent a verification email to your inbox. Please click the link to verify your email and complete your appeal.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Check your spam folder if you don't see the email within a few minutes.
        </p>
      </div>
    );
  }

  if (submitStatus === "exists") {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="mx-auto w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Appeal Already Submitted</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {errorMessage || "You already have a pending appeal. Please check your email for the verification link."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSubmitStatus("idle");
            form.reset();
          }}
        >
          Submit New Appeal
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Why should we grant access?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please explain why you're requesting access. For example: 'I'm a US citizen traveling abroad for work...'"
                  className="min-h-[100px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitStatus === "error" && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{errorMessage || "Failed to submit appeal. Please try again."}</p>
          </div>
        )}

        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Appeal
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AppealForm;
