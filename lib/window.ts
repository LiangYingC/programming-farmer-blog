export const checkIsUserPreferLightModeOnOS = () => {
  // Detect whether the user is using the light mode in the os system
  // Ref https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/#os-level
  return window.matchMedia('(prefers-color-scheme: light)').matches;
};

export const setItemToLocalStorage = ({ key, value }: { key: string; value: string }) => {
  return window.localStorage.setItem(key, value);
};

export const getItemFromLocalStorage = (key: string) => {
  return window.localStorage.getItem(key);
};

export const removeItemFromLocalStorage = (key: string) => {
  return window.localStorage.removeItem(key);
};
