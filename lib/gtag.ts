interface GtagEvent {
  action: string;
  category: string;
  label: string;
  value?: string;
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const sendEvent = ({ action, category, label, value }: GtagEvent) => {
  console.log({ action, category, label, value });
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
