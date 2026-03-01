import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarSync, Users, Slack, Repeat, MailPlus, ThumbsUp } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface PopularRequest {
  icon: LucideIcon;
  title: string;
  description: string;
  votes: number;
  status: "Planned" | "Under Review" | "Considering";
}

const popularRequests: PopularRequest[] = [
  {
    icon: CalendarSync,
    title: "Google Calendar Two-Way Sync",
    description: "Automatically sync bookings to Google Calendar and block off busy times from your Google Calendar on your booking page.",
    votes: 342,
    status: "Planned"
  },
  {
    icon: Users,
    title: "Team Scheduling",
    description: "Create team booking pages with round-robin or collective availability, perfect for sales teams and support departments.",
    votes: 278,
    status: "Planned"
  },
  {
    icon: Slack,
    title: "Slack Integration",
    description: "Receive booking notifications in Slack channels and allow guests to book directly from Slack using a slash command.",
    votes: 195,
    status: "Under Review"
  },
  {
    icon: Repeat,
    title: "Recurring Meetings",
    description: "Let guests book recurring meetings (weekly, bi-weekly, monthly) with a single booking action.",
    votes: 164,
    status: "Under Review"
  },
  {
    icon: MailPlus,
    title: "Custom Email Templates",
    description: "Customize the confirmation, reminder, and cancellation email templates with your own branding and messaging.",
    votes: 137,
    status: "Considering"
  }
];

const statusColors: Record<string, string> = {
  Planned: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Under Review": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Considering: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
};

const FeatureRequestSection = () => {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !title || !description || !priority) {
      toast.error("Please fill in all fields.");
      return;
    }
    toast.success("Feature request submitted! Thank you for your feedback.");
    setCategory("");
    setTitle("");
    setDescription("");
    setPriority("");
  };

  return (
    <div className="space-y-10">
      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Submit a Feature Request</CardTitle>
          <CardDescription>
            Have an idea to improve the platform? We'd love to hear it. All submissions are reviewed by our product team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fr-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="fr-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduling">Scheduling</SelectItem>
                    <SelectItem value="integrations">Integrations</SelectItem>
                    <SelectItem value="uiux">UI / UX</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fr-priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="fr-priority">
                    <SelectValue placeholder="How important is this?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nice">Nice to Have</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fr-title">Title</Label>
              <Input
                id="fr-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="A short, descriptive title for your request"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fr-description">Description</Label>
              <Textarea
                id="fr-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the feature you'd like to see, the problem it solves, and any implementation ideas."
                rows={4}
                required
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Popular Requests */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Popular Requests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularRequests.map((req, idx) => {
            const Icon = req.icon;
            return (
              <Card key={idx} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <CardTitle className="text-sm font-semibold leading-tight">{req.title}</CardTitle>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[req.status]}`}>
                      {req.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{req.description}</p>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{req.votes} votes</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeatureRequestSection;
