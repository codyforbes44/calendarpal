import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border py-10 sm:py-14 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          {/* Product */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://twitter.com/bookme_bet" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Twitter / X
                </a>
              </li>
              <li>
                <a href="https://linkedin.com/company/bookme-bet" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <img src="/bookme-logo.png" alt="Bᴏᴏᴋᴍᴇ.ʙᴇᴛ" width={24} height={24} loading="lazy" className="h-6 w-6 rounded object-cover" />
            <span className="text-sm text-muted-foreground">
              © 2026 Bᴏᴏᴋᴍᴇ.ʙᴇᴛ. Built with love for better scheduling.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
