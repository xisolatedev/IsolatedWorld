import * as THREE from "./three.js";

// A cloud of tiny points surrounding the world.
export function createStars() {
    const numberOfStars = 650;
    const positions = [];

    for (let i = 0; i < numberOfStars; i++) {
        const x = (Math.random() - 0.5) * 30;
        const y = (Math.random() - 0.5) * 23;
        const z = (Math.random() - 0.5) * 20 - 4;
        positions.push(x, y, z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xb1d5ff,
        size: 0.035,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    return new THREE.Points(geometry, material);
}
