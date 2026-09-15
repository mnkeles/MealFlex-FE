import { divIcon } from "leaflet";
import { Marker } from "react-leaflet";

const locationPinIcon = divIcon({
  className: "mealflex-location-pin",
  html: `<svg width="42" height="48" viewBox="0 0 42 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M21 3C12.15 3 5 10.15 5 19c0 12 16 26 16 26s16-14 16-26C37 10.15 29.85 3 21 3Z" fill="#E73A2C" stroke="white" stroke-width="3"/><circle cx="21" cy="19" r="5.5" fill="white"/></svg>`,
  iconSize: [42, 48],
  iconAnchor: [21, 45],
});

export default function LocationPin({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  return <Marker position={[latitude, longitude]} icon={locationPinIcon} />;
}
