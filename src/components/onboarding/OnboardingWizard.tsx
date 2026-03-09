import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, User, Calendar, Clock, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: string;
  href: string;
  completed: boolean;
}

interface OnboardingWizardProps {
  hasProfile: boolean;
  hasEventTypes: boolean;
  hasAvailability: boolean;
  onDismiss: () => void;
}

const OnboardingWizard = ({
  hasProfile,
  hasEventTypes,
  hasAvailability,
  onDismiss,
}: OnboardingWizardProps) => {
  const navigate = useNavigate();
  
  const steps: OnboardingStep[] = [
    {
      id: "profile",
      title: "Complete Your Profile",
      description: "Add your name and username for your booking page",
      icon: User,
      action: "Set Up Profile",
      href: "/settings",
      completed: hasProfile,
    },
    {
      id: "event",
      title: "Create First Event Type",
      description: "Define meeting types like consultations or demos",
      icon: Calendar,
      action: "Create Event",
      href: "/events/new",
      completed: hasEventTypes,
    },
    {
      id: "availability",
      title: "Set Your Availability",
      description: "Tell us when you're available for meetings",
      icon: Clock,
      action: "Set Availability",
      href: "/availability",
      completed: hasAvailability,
    },
  ];

  const completedSteps = steps.filter((s) => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;
  const allCompleted = completedSteps === steps.length;

  if (allCompleted) return null;

  return (
    <Card className="p-4 sm:p-6 mb-6 sm:mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold mb-1">Welcome to Bookme.bet! 🎉</h2>
          <p className="text-sm text-muted-foreground">
            Complete these steps to start accepting bookings
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{completedSteps} of {steps.length} completed</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all ${
                step.completed
                  ? "bg-primary/5 border-primary/20"
                  : "bg-card border-border hover:border-primary/40 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    step.completed
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {step.completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-sm sm:text-base ${step.completed ? "text-primary" : ""}`}>
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
              </div>
              {!step.completed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(step.href)}
                  className="shrink-0 group w-full sm:w-auto min-h-[44px]"
                >
                  {step.action}
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default OnboardingWizard;
