import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Clock, MoreVertical, Plus, Link, Check, QrCode, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SkeletonEventType } from "@/components/ui/skeleton-card";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface EventType {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  color: string;
  is_active: boolean;
}

const EventTypesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModalEvent, setQrModalEvent] = useState<EventType | null>(null);

  useEffect(() => {
    if (user) {
      loadEventTypes();
      loadUsername();
    }
  }, [user]);

  const loadUsername = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      setUsername(data?.username || null);
    } catch (error) {
      console.error("Error loading username:", error);
    }
  };

  const loadEventTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("event_types")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEventTypes(data || []);
    } catch (error) {
      console.error("Error loading event types:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingUrl = (eventType: EventType) => {
    if (!username) return null;
    const typeSlug = eventType.title.toLowerCase().replace(/\s+/g, "-");
    return `${window.location.origin}/book/${username}?type=${typeSlug}`;
  };

  const copyBookingLink = (eventType: EventType, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const bookingUrl = getBookingUrl(eventType);
    if (!bookingUrl) {
      toast.error("Please set up your username in settings first");
      return;
    }
    
    navigator.clipboard.writeText(bookingUrl).then(() => {
      setCopiedId(eventType.id);
      toast.success("Booking link copied!");
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  const openQrModal = (eventType: EventType, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!username) {
      toast.error("Please set up your username in settings first");
      return;
    }
    
    setQrModalEvent(eventType);
  };

  const downloadQrCode = () => {
    if (!qrModalEvent) return;
    
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
      const pngUrl = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${qrModalEvent.title.toLowerCase().replace(/\s+/g, "-")}-qr-code.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Event Types</h2>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <SkeletonEventType key={i} />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold">Event Types</h2>
        <Button variant="outline" size="sm" onClick={() => navigate("/events/new")}>
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </div>

      {eventTypes.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No event types yet"
          description="Create your first event type to start accepting bookings from others."
          actionLabel="Create Your First Event"
          onAction={() => navigate("/events/new")}
          tip="Event types define the meetings you offer, like '30-min Call' or 'Product Demo'"
        />
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {eventTypes.map((eventType) => (
            <div
              key={eventType.id}
              className="p-3 sm:p-4 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => navigate(`/events/${eventType.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 flex-wrap">
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                      style={{ backgroundColor: eventType.color }}
                    />
                    <h3 className="font-semibold text-sm sm:text-base truncate">{eventType.title}</h3>
                    {eventType.is_active ? (
                      <Badge variant="secondary" className="text-xs shrink-0">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs shrink-0">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 line-clamp-1">
                    {eventType.description || "No description"}
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>{eventType.duration} min</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => copyBookingLink(eventType, e)}
                      >
                        {copiedId === eventType.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Link className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy booking link</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => openQrModal(eventType, e)}
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Show QR code</TooltipContent>
                  </Tooltip>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <Dialog open={!!qrModalEvent} onOpenChange={(open) => !open && setQrModalEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{qrModalEvent?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            {qrModalEvent && getBookingUrl(qrModalEvent) && (
              <>
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={getBookingUrl(qrModalEvent)!}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-xs break-all">
                  {getBookingUrl(qrModalEvent)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const url = getBookingUrl(qrModalEvent);
                      if (url) {
                        navigator.clipboard.writeText(url);
                        toast.success("Link copied!");
                      }
                    }}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button onClick={downloadQrCode}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EventTypesList;
