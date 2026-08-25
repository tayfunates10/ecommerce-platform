"use client";

import { useReportWebVitals } from "next/web-vitals";

type Props = {
  endpoint: string;
};

export function WebVitalsReporter({ endpoint }: Props) {
  useReportWebVitals((metric) => {
    if (metric.name !== "LCP" && metric.name !== "INP" && metric.name !== "CLS") return;

    const payload = JSON.stringify({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
    });

    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
      return;
    }

    void fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
      credentials: "same-origin",
    });
  });

  return null;
}
