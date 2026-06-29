"use client"

const metrics = [
  { value: "10K+", label: "Happy Customers", color: "text-primary" },
  { value: "86", label: "Unique Dishes", color: "text-secondary" },
  { value: "4.8★", label: "Satisfaction", color: "text-accent" },
  { value: "15+", label: "Years Experience", color: "text-primary" }
]

export function MetricsStrip() {
  return (
    <section className="bg-gradient-to-r from-primary to-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <p className={`text-2xl md:text-3xl font-bold ${metric.color}`}>
                {metric.value}
              </p>
              <p className="text-sm text-white/90">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}