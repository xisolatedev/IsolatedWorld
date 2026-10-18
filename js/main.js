// Start the site features that do not depend on Three.js.
import { setupNavigation } from "./navigation.js";
import { startWelcomeAnimation } from "./welcome.js";

setupNavigation();
startWelcomeAnimation();

// Load the 3D scene separately. The static globe is the fallback if it fails.
import("./space/scene.js")
    .then((space) => space.startSpaceScene())
    .catch(() => console.info("Showing the static world (Three.js unavailable)."));
