import { useState } from "react";
import { ShieldX, Mail, Globe, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BLOCK_MESSAGES } from "@/lib/blocked-countries";
import AppealForm from "@/components/geo/AppealForm";

interface RegionBlockedProps {
  countryCode?: string;
}

const RegionBlocked = ({ countryCode }: RegionBlockedProps) => {
  const [isAppealOpen, setIsAppealOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="pb-4 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{BLOCK_MESSAGES.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {BLOCK_MESSAGES.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {BLOCK_MESSAGES.support}
          </p>
          
          {countryCode && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md py-2 px-3">
              <Globe className="w-3 h-3" />
              <span>Detected region: {countryCode}</span>
            </div>
          )}

          {/* Appeal Section */}
          <Collapsible open={isAppealOpen} onOpenChange={setIsAppealOpen}>
            <div className="pt-4 border-t border-border">
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full gap-2 justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Request Access (Appeal)
                  </span>
                  {isAppealOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    If you believe you've been blocked in error (e.g., traveling abroad), 
                    submit an appeal. We'll review your request and get back to you within 2-3 business days.
                  </p>
                </div>
                <AppealForm countryCode={countryCode} />
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Contact Support */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={() => window.location.href = `mailto:${BLOCK_MESSAGES.contactEmail}`}
            >
              <Mail className="w-4 h-4" />
              Contact Support Directly
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            We apologize for any inconvenience. This restriction is in place to comply with 
            applicable laws and regulations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegionBlocked;
