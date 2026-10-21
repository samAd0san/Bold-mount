import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Our pattern/gradient utilities are background-images, not colours — without this, cn("bg-night bg-lattice") drops bg-night.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "bg-image": ["bg-lattice", "bg-lattice-ink"] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
