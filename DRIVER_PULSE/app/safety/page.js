"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../components/LanguageContext";
import Card from "../../components/Card";
import CardGrid from "../../components/CardGrid";
import Badge from "../../components/Badge";
import { getSafetyData } from "../../lib/driverData";

export default function SafetyPage() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(getSafetyData());
  }, []);

  if (!data) return null;

  return (
    <div className="page-section">
      <div className="row between wrap gap-3">
        <div className="col">
          <div className="page-title">{t("safety")}</div>
          <div className="muted">Events, timelines, and stability indicators</div>
        </div>
        <Badge tone={data.safetyScore >= 85 ? "success" : data.safetyScore >= 75 ? "warning" : "danger"}>
          Safety Score {data.safetyScore}
        </Badge>
      </div>

      <div className="mt-4">
        <CardGrid cols={3}>
          <Card title="Total Events" subtitle="Motion + audio flags">
            <div style={{ fontSize: 34, fontWeight: 900 }}>
              {data.eventsTimeline?.length || 0}
            </div>
            <svg className="sparkline" viewBox="0 0 120 56" role="img" aria-label="Events sparkline">
              <polyline
                fill="none"
                stroke="rgba(245,158,11,0.95)"
                strokeWidth="3"
                points={[4, 40, 24, 34, 44, 38, 64, 24, 84, 30, 104, 18, 116, 22].join(" ")}
              />
            </svg>
          </Card>

          <Card title={t("safetyHarshBraking")} subtitle="Hard brake events">
            <div style={{ fontSize: 34, fontWeight: 900 }}>{data.totalHarshBrakes}</div>
            <div className="muted mt-2">Threshold alert: 5+</div>
          </Card>

          <Card title="Audio Stress" subtitle="High cabin noise indicators">
            <div style={{ fontSize: 34, fontWeight: 900 }}>{data.totalAudioSpikes}</div>
            <div className="muted mt-2">Keep volume low for stability</div>
          </Card>
        </CardGrid>
      </div>

      <div className="mt-4">
        <Card title="Event Timeline" subtitle="Ordered by time">
          <div className="col gap-3">
            {(data.eventsTimeline || []).slice(0, 12).map((ev) => (
              <div key={`${ev.trip_id}_${ev.timestamp}_${ev.type}`} className="row between">
                <div className="col">
                  <div style={{ fontWeight: 900 }}>
                    {ev.source === "motion" ? "Motion" : "Audio"} • {ev.type}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Trip {ev.trip_id} • {ev.timestamp} • {ev.severity}
                  </div>
                </div>
                <Badge tone={ev.severity === "high" ? "danger" : ev.severity === "medium" ? "warning" : "neutral"}>
                  {ev.severity}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}