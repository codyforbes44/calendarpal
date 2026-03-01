import AnimatedSection from "@/components/ui/animated-section";

const GoogleCalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M18.316 5.684H5.684v12.632h12.632V5.684z" fill="#fff" />
    <path d="M18.316 24L24 18.316V5.684L18.316 0v5.684H5.684V0L0 5.684v12.632L5.684 24v-5.684h12.632V24z" fill="#1A73E8" />
    <path d="M5.684 18.316H0L5.684 24v-5.684z" fill="#1557B0" />
    <path d="M24 5.684h-5.684V0L24 5.684z" fill="#1557B0" />
    <path d="M18.316 18.316V24L24 18.316h-5.684z" fill="#185ABC" />
    <path d="M5.684 0v5.684H0L5.684 0z" fill="#185ABC" />
    <path d="M8.2 16.632a3.1 3.1 0 01-1.12-.84l.78-.64c.22.28.48.5.78.64.3.16.62.24.96.24.36 0 .68-.08.94-.26.26-.18.4-.42.4-.72 0-.32-.14-.56-.42-.74-.28-.18-.64-.26-1.08-.26h-.66v-.92h.6c.38 0 .68-.08.92-.24.24-.16.36-.38.36-.66 0-.26-.1-.46-.32-.62-.22-.16-.5-.24-.82-.24-.3 0-.56.06-.78.2-.22.12-.4.3-.54.52l-.78-.52c.2-.34.48-.62.84-.82.36-.2.78-.3 1.26-.3.36 0 .68.06.96.16.28.1.5.26.66.48.16.2.24.46.24.74 0 .3-.08.56-.26.76-.18.2-.4.36-.68.46v.04c.32.1.58.28.78.5.2.24.3.52.3.84 0 .32-.08.6-.26.84-.18.24-.42.42-.74.56-.32.12-.68.18-1.1.18zm6.26 0c-.58 0-1.08-.16-1.5-.46-.42-.32-.72-.76-.9-1.34l.88-.36c.14.42.34.74.6.96.26.22.56.32.92.32.38 0 .7-.14.94-.4.24-.28.36-.64.36-1.08 0-.46-.12-.82-.38-1.08-.24-.26-.56-.38-.96-.38-.26 0-.48.06-.68.16-.2.1-.36.26-.46.44l-.84-.06.52-4.28h4.28v.92h-3.44l-.3 2.3c.14-.12.3-.22.52-.3.22-.08.44-.12.7-.12.38 0 .72.08 1.02.26.3.18.54.42.72.74.18.32.26.7.26 1.12 0 .44-.1.82-.3 1.16-.2.34-.48.6-.82.78-.34.2-.74.3-1.18.3z" fill="#1A73E8" />
  </svg>
);

const ZoomIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill="#2D8CFF" />
    <path d="M5 8.5a1.5 1.5 0 011.5-1.5h7A1.5 1.5 0 0115 8.5v7a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 015 15.5v-7zm11.5 1l2.7-1.8a.5.5 0 01.8.4v7.8a.5.5 0 01-.8.4l-2.7-1.8v-5z" fill="#fff" />
  </svg>
);

const TeamsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill="#5B5FC7" />
    <path d="M16.5 7.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-5-1a2 2 0 100-4 2 2 0 000 4z" fill="#fff" />
    <path d="M15 9h3.5a.5.5 0 01.5.5v4a2.5 2.5 0 01-2.5 2.5H15V9z" fill="#C4C5F5" />
    <path d="M4 9.5A.5.5 0 014.5 9h8a.5.5 0 01.5.5v5a3 3 0 01-3 3h-3a3 3 0 01-3-3v-5z" fill="#fff" />
    <path d="M7.5 12v3M9.5 11v4" stroke="#5B5FC7" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const OutlookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill="#0078D4" />
    <path d="M13 6l7 2v8l-7 2V6z" fill="#28A8EA" />
    <path d="M13 8v8l-9-1.5V9.5L13 8z" fill="#0078D4" />
    <rect x="3" y="7" width="11" height="10" rx="1.5" fill="#0364B8" />
    <ellipse cx="8.5" cy="12" rx="2.5" ry="3" fill="none" stroke="#fff" strokeWidth="1.3" />
  </svg>
);

const SlackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M5.5 14.5A1.5 1.5 0 117 16v-1.5H5.5zm1.5 0A1.5 1.5 0 118.5 16H7v-1.5z" fill="#E01E5A" />
    <path d="M7 5.5A1.5 1.5 0 118.5 7H7V5.5zM7 7a1.5 1.5 0 11-1.5 1.5H7V7z" fill="#36C5F0" />
    <path d="M18.5 8.5A1.5 1.5 0 1117 7h1.5v1.5zm-1.5 0A1.5 1.5 0 1115.5 7H17v1.5z" fill="#2EB67D" />
    <path d="M17 18.5a1.5 1.5 0 11-1.5-1.5H17v1.5zm0-1.5a1.5 1.5 0 111.5-1.5H17V17z" fill="#ECB22E" />
    <path d="M8.5 14.5H14V16a1.5 1.5 0 01-1.5 1.5h-2.5A1.5 1.5 0 018.5 16v-1.5z" fill="#E01E5A" />
    <path d="M8.5 7h4A1.5 1.5 0 0114 8.5v2.5H8.5A1.5 1.5 0 017 9.5v-1A1.5 1.5 0 018.5 7z" fill="#36C5F0" />
    <path d="M14 8.5h1.5A1.5 1.5 0 0117 10v4h-1.5a1.5 1.5 0 01-1.5-1.5v-4z" fill="#2EB67D" />
    <path d="M7 10h1.5v4A1.5 1.5 0 017 15.5V10z" fill="#ECB22E" />
  </svg>
);

const integrations = [
  { name: "Google Calendar", icon: <GoogleCalendarIcon /> },
  { name: "Zoom", icon: <ZoomIcon /> },
  { name: "Microsoft Teams", icon: <TeamsIcon /> },
  { name: "Outlook", icon: <OutlookIcon /> },
  { name: "Slack", icon: <SlackIcon /> },
];

const LogoCloud = () => {
  return (
    <section className="py-10 sm:py-14 border-y border-border bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center">
          <p className="text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6 uppercase tracking-wider font-medium">
            Works with the tools you already use
          </p>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 items-center">
            {integrations.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 sm:gap-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0">
                  {item.icon}
                </div>
                <span className="text-sm sm:text-base font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default LogoCloud;
