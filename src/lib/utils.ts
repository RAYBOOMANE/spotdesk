import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number): string {
  return n.toLocaleString();
}

export function signed(n: number): string {
  return (n >= 0 ? "+$" : "-$") + Math.abs(n).toLocaleString();
}
