export type MainTab = "home" | "browse" | "booking" | "activity";

export interface GymItem {
  id: string;
  name: string;
  location: string;
  price: string;
  capacity: `${number}%`;
  tag: string;
}
