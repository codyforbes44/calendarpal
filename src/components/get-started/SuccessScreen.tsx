import { Check } from "lucide-react";

const SuccessScreen = () => (
  <div className="text-center space-y-6 animate-scale-in">
    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
      <Check className="w-10 h-10 text-primary" />
    </div>
    <div className="space-y-2">
      <h1 className="text-3xl sm:text-4xl font-bold font-display">You're all set!</h1>
      <p className="text-muted-foreground text-base sm:text-lg">Taking you to your dashboard…</p>
    </div>
    <div className="w-48 h-1 rounded-full bg-muted mx-auto overflow-hidden">
      <div className="h-full bg-primary rounded-full animate-[progress_2.5s_ease-in-out_forwards]" />
    </div>
  </div>
);

export default SuccessScreen;
