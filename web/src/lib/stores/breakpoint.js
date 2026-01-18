import { readable, derived } from "svelte/store";
import { config } from "./config.js";

// Reactive window width
export const windowWidth = readable(
	typeof window !== "undefined" ? window.innerWidth : 1920,
	(set) => {
		if (typeof window === "undefined") return;

		const handler = () => set(window.innerWidth);
		window.addEventListener("resize", handler);
		return () => window.removeEventListener("resize", handler);
	},
);

// Current layout configuration based on window width
export const currentLayout = derived(
	[windowWidth, config],
	([$width, $config]) => {
		if (!$config) return null;

		// Find the first breakpoint that matches (breakpoints are sorted by minWidth desc)
		return (
			$config.breakpoints.find((bp) => $width >= bp.minWidth) ||
			$config.breakpoints[$config.breakpoints.length - 1]
		);
	},
);

// Is mobile breakpoint
export const isMobile = derived([windowWidth, config], ([$width, $config]) => {
	if (!$config) return false;
	return $width < $config.mobileBreakpoint;
});
