
import * as THREE from "./three.js";
import { createPlanet } from "./planet.js";
import { createStars } from "./stars.js";
import { createBlastSystem } from "./blasts.js";

export function startSpaceScene() {
    const canvas = document.getElementById("space-canvas");
    const container = document.querySelector(".hero-world");

    if (!canvas || !container) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 9.2);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Neutral lighting for the new light-mode theme.
    const sunlight = new THREE.DirectionalLight(0xffffff, 2.35);
    sunlight.position.set(-4, 4, 6);
    scene.add(sunlight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const world = createPlanet();

    scene.add(world.group);
    scene.add(createStars());

    const blasts = createBlastSystem(scene, camera, world.mesh);

    function onWheel(event) {
        // Only control rotation when scrolling over Earth.
        if (!blasts.isHoveringPlanet()) return;

        event.preventDefault();

        world.changeRotationSpeed(event.deltaY);
    }

    canvas.addEventListener("wheel", onWheel, { passive: false });


    function onContextMenu(event) {
        // Only intercept right-clicks directly on the planet.
        const triggered = blasts.nuke(
            event.clientX,
            event.clientY,
            canvas
        );

        if (triggered) {
            event.preventDefault();
        }
    }

    canvas.addEventListener("contextmenu", onContextMenu);
   
function resizeScene() {
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const width = hero.clientWidth;
    const height = hero.clientHeight;

    if (!width || !height) return;

    // Reconstruct the original .hero-world rectangle.
    const viewportWidth = window.innerWidth;

    let originalWidth;
    let originalRight;
    let originalTop = 0;
    let originalBottom = 0;

    if (viewportWidth <= 600) {
        originalWidth = 690;
        originalRight = -300;
        originalTop = 320;
        originalBottom = 0;
    } else if (viewportWidth <= 800) {
        originalWidth = 750;
        originalRight = -210;
        originalTop = 250;
        originalBottom = -15;
    } else {
        originalWidth = Math.max(width * 0.60, 700);

        originalRight = viewportWidth <= 1080
            ? -130
            : Math.max(-60, (viewportWidth - 1390) / 2);
    }

    const originalHeight = height - originalTop - originalBottom;

    // Original globe viewport position relative to the hero.
    const originalLeft = width - originalRight - originalWidth;

    // Use the original viewport's pixel scale and camera FOV,
    // but render into the full hero rectangle.
    const virtualWidth = width;
    const virtualHeight = height;

    camera.aspect = virtualWidth / virtualHeight;

    // Preserve the original projected globe scale.
    const verticalFov = 42 * Math.PI / 180;

    const adjustedFov = 2 * Math.atan(
        Math.tan(verticalFov / 2) *
        (height / originalHeight)
    );

    camera.fov = THREE.MathUtils.radToDeg(adjustedFov);

    // Shift projection so the globe stays centered in
    // its previous .hero-world rectangle.
    const originalCenterX = originalLeft + originalWidth / 2;
    const originalCenterY = originalTop + originalHeight / 2;

    const shiftX = originalCenterX - width / 2;
    const shiftY = originalCenterY - height / 2;

    camera.filmOffset = 0;
    camera.updateProjectionMatrix();

    // Apply an off-axis projection shift.
    const projection = camera.projectionMatrix.elements;

    projection[8] -= 2 * shiftX / originalHeight /
        Math.tan(verticalFov / 2) *
        Math.tan(adjustedFov / 2);

    projection[9] += 2 * shiftY / originalHeight /
        Math.tan(verticalFov / 2) *
        Math.tan(adjustedFov / 2);

    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    renderer.setSize(width, height, false);
}


    resizeScene();

    window.addEventListener("resize", resizeScene);

    container.classList.add("canvas-ready");

    // Click or tap the planet to fire.
    function onPointerDown(event) {
        if (event.button !== 0) return;

        blasts.fire(event.clientX, event.clientY, canvas);
    }
    function onPointerMove(event) {
        blasts.hover(event.clientX, event.clientY, canvas);
    }

    function onPointerLeave() {
        blasts.hideMarker();
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    canvas.addEventListener("pointerdown", onPointerDown);

    const clock = new THREE.Clock();

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    function animate() {
        const delta = Math.min(clock.getDelta(), 0.05);

        if (!reducedMotion) {
            world.update(delta);
        }

        blasts.update(delta);

        renderer.render(scene, camera);

        requestAnimationFrame(animate);
    }

    animate();

    return function cleanup() {
        window.removeEventListener("resize", resizeScene);

        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        canvas.removeEventListener("wheel", onWheel);
        canvas.removeEventListener("contextmenu", onContextMenu);

        blasts.dispose();
        renderer.dispose();
    };
}
