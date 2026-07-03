// ================================================================
// SUB-COMPONENT: MobileTimeline
// ================================================================

interface TimelineProps {
  steps: TimelineStep[];
}

export function MobileTimeline({ steps }: TimelineProps) {
  return (
    <div className="clay-card">
      <p className="text-xs font-bold text-olive-500 uppercase tracking-wider mb-4">
        Timeline / Progress
      </p>
      <div className="flex items-center justify-between px-1">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={
                  step.completed
                    ? {
                        background:
                          "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
                        boxShadow:
                          "3px 3px 7px rgba(23,29,9,0.22), -1px -1px 4px rgba(114,143,50,0.18)",
                      }
                    : undefined
                }
              >
                {step.completed ? (
                  <CheckCircle size={16} className="text-white" />
                ) : (
                  <div className="clay-inset w-8 h-8 rounded-full flex items-center justify-center">
                    <Circle size={14} className="text-olive-300" />
                  </div>
                )}
              </div>
              <span
                className={`text-[9px] mt-1.5 font-semibold text-center leading-tight ${
                  step.completed ? "text-olive-700" : "text-olive-300"
                }`}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className="h-0.5 w-5 mx-1 -mt-5 rounded-full"
                style={{
                  background: steps[index + 1].completed
                    ? "var(--color-olive-500)"
                    : "var(--color-cream-400)",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
