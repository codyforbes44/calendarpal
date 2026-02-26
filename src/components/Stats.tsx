import { useEffect, useRef, useState } from "react";
import AnimatedSection from "@/components/ui/animated-section";

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  prefix?: string;
}

const stats: StatItem[] = [
  { value: 50000, suffix: "+", label: "Bookings Automated" },
  { value: 2, suffix: " min", label: "Average Setup Time" },
  { value: 90, suffix: "%", label: "Reduction in No-Shows" },
  { value: 4.9, suffix: "/5", label: "User Rating" },
];

function useCountUp(target: number, isVisible: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!isVisible) return;
    const start = performance.now();
    const isDecimal = target % 1 !== 0;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isVisible, target, duration]);

  return count;
}

const StatCounter = ({ stat, isVisible }: { stat: StatItem; isVisible: boolean }) => {
  const count = useCountUp(stat.value, isVisible);

  return (
    <div className="text-center space-y-1">
      <div className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground">
        {stat.prefix}
        {stat.value >= 1000 ? count.toLocaleString() : count}
        {stat.suffix}
      </div>
      <p className="text-sm sm:text-base text-muted-foreground">{stat.label}</p>
    </div>
  );
};

const Stats = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-primary opacity-[0.04]" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            {stats.map((stat, i) => (
              <StatCounter key={i} stat={stat} isVisible={isVisible} />
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Stats;
