import type { Metric } from '@/lib/sessions'

export function MetricsTable({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="glass-card ssn-metrics" data-testid="session-metrics">
      <h2 className="section-title ssn-metrics-title">The metrics</h2>
      <div className="ssn-metrics-table" role="table" aria-label="Metrics to track">
        <div className="ssn-metrics-row ssn-metrics-head" role="row">
          <span role="columnheader">Metric</span>
          <span role="columnheader">How</span>
          <span role="columnheader">Cadence</span>
        </div>
        {metrics.map((metric) => (
          <div className="ssn-metrics-row" role="row" key={metric.name}>
            <span role="cell" className="ssn-metrics-name">
              {metric.name}
            </span>
            <span role="cell" className="ssn-metrics-how">
              {metric.how}
            </span>
            <span role="cell" className="ssn-metrics-cadence tabular-nums">
              {metric.cadence}
            </span>
          </div>
        ))}
      </div>
      <style>{`
        .ssn-metrics {
          padding: 1.4rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }
        .ssn-metrics-title {
          margin: 0;
        }
        .ssn-metrics-title::after {
          display: none;
        }
        .ssn-metrics-table {
          display: flex;
          flex-direction: column;
        }
        .ssn-metrics-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
          gap: 0.75rem;
          padding: 0.65rem 0.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          align-items: baseline;
        }
        .ssn-metrics-row:last-child {
          border-bottom: none;
        }
        .ssn-metrics-head {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.62rem;
          color: rgba(255, 255, 255, 0.4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.14);
        }
        .ssn-metrics-name {
          color: #fff;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .ssn-metrics-how {
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.83rem;
          line-height: 1.4;
        }
        .ssn-metrics-cadence {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.72rem;
          white-space: nowrap;
          text-align: right;
        }
        @media (max-width: 640px) {
          .ssn-metrics-row {
            grid-template-columns: 1fr;
            gap: 0.2rem;
            padding: 0.75rem 0;
          }
          .ssn-metrics-head {
            display: none;
          }
          .ssn-metrics-cadence {
            text-align: left;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
        }
      `}</style>
    </div>
  )
}
