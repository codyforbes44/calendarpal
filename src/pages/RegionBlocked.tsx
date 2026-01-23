import { ShieldX, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BLOCK_MESSAGES } from "@/lib/blocked-countries";

interface RegionBlockedProps {
  countryCode?: string;
}

const RegionBlocked = ({ countryCode }: RegionBlockedProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{BLOCK_MESSAGES.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {BLOCK_MESSAGES.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {BLOCK_MESSAGES.support}
          </p>
          
          {countryCode && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md py-2 px-3">
              <Globe className="w-3 h-3" />
              <span>Detected region: {countryCode}</span>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.location.href = `mailto:${BLOCK_MESSAGES.contactEmail}`}
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </Button>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            We apologize for any inconvenience. This restriction is in place to comply with 
            applicable laws and regulations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegionBlocked;
