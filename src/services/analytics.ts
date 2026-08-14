import ReactGA from "react-ga4";

// استبدل هذا المعرف بمعرف القياس الخاص بك من Google Analytics
// Format: G-XXXXXXXXXX
const MEASUREMENT_ID = "G-PLACEHOLDER"; 

export const initAnalytics = () => {
  if (MEASUREMENT_ID === "G-PLACEHOLDER") {
    return; // Analytics not configured - silently skip
  }
  ReactGA.initialize(MEASUREMENT_ID);
};

export const logPageView = (pageName: string) => {
  if (MEASUREMENT_ID === "G-PLACEHOLDER") return;
  
  ReactGA.send({ hitType: "pageview", page: `/${pageName}` });
};

export const logEvent = (category: string, action: string, label?: string) => {
  if (MEASUREMENT_ID === "G-PLACEHOLDER") return;

  ReactGA.event({
    category,
    action,
    label,
  });
};