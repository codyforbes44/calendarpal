import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface ThemeLogoProps {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

const ThemeLogo = ({ className, width, height, alt = "Bᴏᴏᴋᴍᴇ.ʙᴇᴛ" }: ThemeLogoProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const src = mounted && resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png";

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
};

export default ThemeLogo;
