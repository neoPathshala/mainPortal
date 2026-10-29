import { Check, GraduationCap, Mail, UserRound } from "lucide-react";

const steps = [
  { label: "Your details", icon: UserRound },
  { label: "Study preferences", icon: GraduationCap },
  { label: "Verify email", icon: Mail },
];

export function SignupProgress({ currentStep }: { currentStep: number }) {
  return (
    <ol aria-label="Account creation progress" className="mb-7 grid grid-cols-3">
      {steps.map(({ label, icon: Icon }, index) => {
        const active = index <= currentStep;
        const completed = index < currentStep;
        return (
          <li key={label} aria-current={index === currentStep ? "step" : undefined} className="relative flex min-w-0 flex-col items-center text-center">
            {index > 0 && (
              <span aria-hidden="true" className="absolute right-1/2 top-[14px] h-1 w-full overflow-hidden bg-muted sm:top-[16px]">
                <span className={`block h-full origin-left bg-primary transition-transform duration-500 ease-in-out motion-reduce:transition-none ${active ? "scale-x-100" : "scale-x-0"}`} />
              </span>
            )}
            <span aria-hidden="true" className={`relative z-10 flex size-8 items-center justify-center rounded-full transition-colors duration-500 motion-reduce:transition-none sm:size-9 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {completed ? <Check className="size-4 sm:size-[18px]" strokeWidth={2} /> : <Icon className="size-4 sm:size-[18px]" strokeWidth={1.75} />}
            </span>
            <span className={`relative mt-2.5 px-1 text-[11px] font-medium leading-4 transition-colors duration-500 motion-reduce:transition-none sm:text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>
              {label}
              {completed && <span className="sr-only"> (completed)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
