// Svelte action for lazy loading with IntersectionObserver
export function lazyload(node, options = {}) {
	const { rootMargin = "800px 0px", onLoad, eager = false } = options;

	// If eager load, trigger immediately
	if (eager) {
		if (onLoad) onLoad();
		return { destroy() {} };
	}

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					if (onLoad) onLoad();
					observer.unobserve(node);
				}
			});
		},
		{ rootMargin, threshold: 0 },
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		},
		update(newOptions) {
			// If options change to eager, trigger load
			if (newOptions.eager && !options.eager) {
				if (newOptions.onLoad) newOptions.onLoad();
				observer.disconnect();
			}
		},
	};
}
