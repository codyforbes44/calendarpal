import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border py-10 sm:py-12 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/bookme-logo.png" alt="BookMe.cool" className="h-6 w-6 rounded object-cover" />
            <span className="text-sm text-muted-foreground">
              © 2025 BookMe.cool. Built with love for better scheduling.
            </span>
          </div>
          <div className="flex gap-5 sm:gap-6 text-sm">
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/support" className="text-muted-foreground hover:text-foreground transition-colors">
              Support
            </Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
