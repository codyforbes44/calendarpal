import { useState } from "react";

interface HeroBackgroundProps {
  page: "home" | "about" | "pricing" | "support" | "auth";
  opacity?: number;
  className?: string;
}

const HeroBackground = ({ page, opacity = 0.3, className = "" }: HeroBackgroundProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const imageUrl = `${supabaseUrl}/storage/v1/object/public/hero-images/hero-${page}.png`;

  if (error) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        style={{ opacity: loaded ? opacity : 0 }}
      />
      {/* Gradient overlay - stronger on mobile for text readability, lighter on desktop to show image */}
      {loaded && (
        <div
          className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/70 sm:from-background/30 sm:via-background/15 sm:to-background/50"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default HeroBackground;
