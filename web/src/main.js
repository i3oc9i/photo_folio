import { mount } from "svelte";
import App from "./App.svelte";
import "./lib/styles/global.css";

const app = mount(App, {
	target: document.getElementById("app"),
});

// Register service worker
if ("serviceWorker" in navigator) {
	navigator.serviceWorker
		.register("/sw.js")
		.then((reg) => console.log("Service Worker registered"))
		.catch((err) => console.log("Service Worker registration failed:", err));
}

export default app;
