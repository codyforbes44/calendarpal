import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Check,
  Twitter,
  Linkedin,
  Facebook,
  Mail,
  MessageCircle,
  ExternalLink,
  Share2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  fullName?: string;
}

const ShareModal = ({ open, onOpenChange, username, fullName }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  
  const bookingUrl = `${window.location.origin}/book/${username}`;
  const shareText = fullName 
    ? `Book a meeting with ${fullName}` 
    : "Book a meeting with me";
  const encodedUrl = encodeURIComponent(bookingUrl);
  const encodedText = encodeURIComponent(shareText);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareLinks = [
    {
      name: "Twitter",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      color: "hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:border-[#0A66C2]/30",
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/30",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      color: "hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30",
    },
    {
      name: "Email",
      icon: Mail,
      url: `mailto:?subject=${encodedText}&body=${encodeURIComponent(`${shareText}\n\n${bookingUrl}`)}`,
      color: "hover:bg-accent/10 hover:text-accent hover:border-accent/30",
    },
  ];

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: shareText,
          url: bookingUrl,
        });
      } catch {
        // User cancelled share
      }
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${username}-booking-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR code downloaded!");
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          Share Your Booking Link
        </span>
      }
      description="Share your booking page so others can schedule meetings with you."
    >
      <div className="space-y-6 pt-4">
        {/* Copy Link Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Booking Link</label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={bookingUrl}
              className="font-mono text-sm bg-muted"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="shrink-0 min-w-[44px] min-h-[44px]"
              aria-label="Copy link"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(bookingUrl, "_blank")}
              className="shrink-0 min-w-[44px] min-h-[44px]"
              aria-label="Open link"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium">QR Code</label>
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <QRCodeSVG
                id="qr-code-svg"
                value={bookingUrl}
                size={100}
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                Scan this code to open your booking page
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQRCode}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download QR
              </Button>
            </div>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Share on Social Media</label>
          <div className="grid grid-cols-5 gap-2">
            {shareLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.name}
                  variant="outline"
                  size="lg"
                  className={`flex flex-col items-center gap-1 h-auto py-3 min-h-[44px] transition-all ${link.color}`}
                  onClick={() => window.open(link.url, "_blank", "width=600,height=400")}
                  aria-label={`Share on ${link.name}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px]">{link.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Native Share (mobile) */}
        {typeof navigator !== "undefined" && navigator.share && (
          <Button
            variant="hero"
            className="w-full min-h-[44px]"
            onClick={handleNativeShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share via Device
          </Button>
        )}

        {/* Quick Copy Button */}
        <Button
          variant={copied ? "outline" : "hero"}
          className="w-full min-h-[44px]"
          onClick={copyToClipboard}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </Button>
      </div>
    </ResponsiveModal>
  );
};

export default ShareModal;
