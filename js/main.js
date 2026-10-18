// Start the site features that do not depend on Three.js.
import { setupNavigation } from "./navigation.js";
import { startWelcomeAnimation } from "./welcome.js";

setupNavigation();
startWelcomeAnimation();

// Load the 3D scene separately. The static globe is the fallback if it fails.
import("./space/scene.js")
    .then((space) => space.startSpaceScene())
    .catch(() => console.info("Showing the static world (Three.js unavailable)."));

const time = document.getElementById("elapsed-time");

//elapse time since page load
let startTime = Date.now();
let t = 0;
setInterval(() => {
    t++;
    time.textContent = `// ${String(t).padStart(3, "0")}`;
}, 1000);