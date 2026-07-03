// ================================================================
// SUB-COMPONENT: DesktopTimeline
// ================================================================

function DesktopTimeline({ steps }: TimelineProps) {
  return (
    <div className="clay-card">
      <h3 className="font-bold text-olive-900 text-base mb-6">
        Order Timeline
      </h3>
      <div className="flex items-center justify-between px-2">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={
                  step.completed
                    ? {
                        background:
                          "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
                        boxShadow:
                          "5px 5px 12px rgba(23,29,9,0.24), -2px -2px 7px rgba(114,143,50,0.20)",
                      }
                    : undefined
                }
              >
                {step.completed ? (
                  <step.icon size={22} className="text-white" />
                ) : (
                  <div className="clay-inset w-12 h-12 rounded-full flex items-center justify-center">
                    <step.icon size={20} className="text-olive-300" />
                  </div>
                )}
              </div>
              <span
                className={`text-xs mt-2.5 font-semibold text-center ${
                  step.completed ? "text-olive-700" : "text-olive-300"
                }`}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className="h-0.5 flex-1 mx-2 -mt-6 rounded-full"
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