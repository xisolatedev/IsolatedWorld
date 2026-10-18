import * as THREE from "./three.js";
import { createPlanet } from "./planet.js";
import { createStars } from "./stars.js";

// Sets up the camera, lights, renderer, and animation loop.
export function startSpaceScene() {
    const canvas = document.getElementById("space-canvas");
    const container = document.querySelector(".hero-world");
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 9.2);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const sunlight = new THREE.DirectionalLight(0xc7eaff, 2.35);
    sunlight.position.set(-4, 4, 6);
    scene.add(sunlight);
    scene.add(new THREE.AmbientLight(0x315379, 0.7));

    const world = createPlanet();
    scene.add(world.group);
    scene.add(createStars());

    function resizeScene() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    }

    resizeScene();
    window.addEventListener("resize", resizeScene);
    container.classList.add("canvas-ready");

    const clock = new THREE.Clock();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function animate() {
        const delta = clock.getDelta();
        if (!reducedMotion) world.update(delta);
        renderer.render(scene, camera);
        if (!reducedMotion) requestAnimationFrame(animate);
    }

    animate();
}
