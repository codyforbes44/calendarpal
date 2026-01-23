import { useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isCountryBlocked } from "@/lib/blocked-countries";
import RegionBlocked from "@/pages/RegionBlocked";
import { Loader2 } from "lucide-react";

interface GeoAccessGuardProps {
  children: ReactNode;
}

interface GeoCheckResult {
  blocked: boolean;
  country: string | null;
  reason: string | null;
}

const GEO_CHECK_STORAGE_KEY = 'calendarpal_geo_check';
const GEO_CHECK_EXPIRY_MS = 1000 * 60 * 60; // 1 hour

const GeoAccessGuard = ({ children }: GeoAccessGuardProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [countryCode, setCountryCode] = useState<string | null>(null);

  useEffect(() => {
    const checkGeoAccess = async () => {
      try {
        // Check session storage for cached result
        const cached = sessionStorage.getItem(GEO_CHECK_STORAGE_KEY);
        if (cached) {
          const { result, timestamp } = JSON.parse(cached);
          // Check if cache is still valid (within 1 hour)
          if (Date.now() - timestamp < GEO_CHECK_EXPIRY_MS) {
            setIsBlocked(result.blocked);
            setCountryCode(result.country);
            setIsChecking(false);
            return;
          }
        }

        // Call the edge function to check geo access
        const { data, error } = await supabase.functions.invoke<GeoCheckResult>('check-geo-access');

        if (error) {
          console.error('Geo check error:', error);
          // On error, allow access (fail open)
          setIsBlocked(false);
          setIsChecking(false);
          return;
        }

        const result = data || { blocked: false, country: null, reason: null };
        
        // Cache the result in session storage
        sessionStorage.setItem(GEO_CHECK_STORAGE_KEY, JSON.stringify({
          result,
          timestamp: Date.now()
        }));

        setIsBlocked(result.blocked);
        setCountryCode(result.country);
      } catch (error) {
        console.error('Geo access check failed:', error);
        // On error, allow access (fail open to not block legitimate users)
        setIsBlocked(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkGeoAccess();
  }, []);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show blocked page if access is denied
  if (isBlocked) {
    return <RegionBlocked countryCode={countryCode || undefined} />;
  }

  // Render children if access is allowed
  return <>{children}</>;
};

export default GeoAccessGuard;
