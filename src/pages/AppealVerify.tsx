import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type VerifyStatus = "loading" | "success" | "already_verified" | "error";

const AppealVerify = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("No verification token provided.");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("geo-appeal", {
          body: {
            action: "verify",
            token,
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.success) {
          if (data.status === "verified" && data.message?.includes("already")) {
            setStatus("already_verified");
          } else {
            setStatus("success");
          }
          setMessage(data.message);
        } else {
          throw new Error(data?.error || "Verification failed");
        }
      } catch (error: any) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(error.message || "An error occurred during verification");
      }
    };

    verifyToken();
  }, [searchParams]);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <CardTitle className="text-xl">Verifying Your Email</CardTitle>
            <CardDescription>Please wait while we verify your appeal...</CardDescription>
          </>
        );

      case "success":
        return (
          <>
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-xl">Email Verified!</CardTitle>
            <CardDescription className="text-base mt-2">
              {message || "Your email has been verified successfully."}
            </CardDescription>
          </>
        );

      case "already_verified":
        return (
          <>
            <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
            <CardTitle className="text-xl">Already Verified</CardTitle>
            <CardDescription className="text-base mt-2">
              {message || "Your email was already verified. Our team is reviewing your appeal."}
            </CardDescription>
          </>
        );

      case "error":
        return (
          <>
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">Verification Failed</CardTitle>
            <CardDescription className="text-base mt-2">
              {message || "We couldn't verify your email. The link may be invalid or expired."}
            </CardDescription>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4 space-y-4">
          {renderContent()}
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">What happens next?</h4>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li>• Our team will review your appeal</li>
                <li>• You'll receive an email with our decision</li>
                <li>• Review typically takes 2-3 business days</li>
              </ul>
            </div>
          )}

          {status === "error" && (
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please try submitting a new appeal or contact our support team.
            </p>
          )}

          <Button variant="outline" asChild className="gap-2">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
              Return to Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppealVerify;
