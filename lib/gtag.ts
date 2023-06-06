interface GtagEvent {
  eventName: string;
  eventParams: object;
}

export const sendEvent = ({ eventName, eventParams }: GtagEvent) => {
  window.gtag('event', eventName, eventParams);
};
