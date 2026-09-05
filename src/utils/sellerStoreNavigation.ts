const STORE_NAVIGATION_EVENT = "mealflex:before-seller-store-navigation";

export function confirmSellerStoreNavigation(): boolean {
  return window.dispatchEvent(
    new CustomEvent(STORE_NAVIGATION_EVENT, { cancelable: true }),
  );
}

export function subscribeToSellerStoreNavigation(
  listener: (event: Event) => void,
) {
  window.addEventListener(STORE_NAVIGATION_EVENT, listener);
  return () => window.removeEventListener(STORE_NAVIGATION_EVENT, listener);
}
