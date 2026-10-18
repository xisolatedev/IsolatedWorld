
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

    function resizeScene() {
        const width = container.clientWidth;
        const height = container.clientHeight;

        if (!width || !height) return;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

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

        blasts.dispose();
        renderer.dispose();
    };
}
