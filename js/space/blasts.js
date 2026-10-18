
import * as THREE from "./three.js";

export function createBlastSystem(scene, camera, planet) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const projectiles = [];
    const impacts = [];

    const projectileGeometry = new THREE.SphereGeometry(0.055, 12, 12);


    // 3D targeting marker.
    const marker = new THREE.Group();

    const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3030,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    // Outer targeting ring.
    const markerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.11, 0.125, 48),
        markerMaterial
    );
    marker.add(markerRing);

    // Center targeting dot.
    const markerDot = new THREE.Mesh(
        new THREE.CircleGeometry(0.025, 24),
        markerMaterial
    );
    marker.add(markerDot);

    // Four radial targeting ticks.
    const tickGeometry = new THREE.PlaneGeometry(0.055, 0.012);

    for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2;

        const tick = new THREE.Mesh(
            tickGeometry,
            markerMaterial
        );

        tick.position.set(
            Math.cos(angle) * 0.17,
            Math.sin(angle) * 0.17,
            0
        );

        tick.rotation.z = angle;
        marker.add(tick);
    }

    marker.visible = false;

    // Parent to the planet so the marker uses its local coordinates.
    planet.add(marker);

    const normalAxis = new THREE.Vector3(0, 0, 1);
    const markerNormal = new THREE.Vector3();

    function hover(clientX, clientY, canvas) {
        const rect = canvas.getBoundingClientRect();

        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        const hits = raycaster.intersectObject(planet, false);

        if (hits.length === 0) {
            marker.visible = false;
            canvas.style.cursor = "crosshair";
            return;
        }
        canvas.style.cursor = "none";
        const hit = hits[0];

        // Convert world-space intersection to planet-local coordinates.
        const localPoint = planet.worldToLocal(hit.point.clone());

        // Sphere normals point outward from its center.
        markerNormal.copy(localPoint).normalize();

        // Position the reticle just above the planet's surface.
        marker.position.copy(localPoint)
            .addScaledVector(markerNormal, 0.025);

        // Rotate the reticle to face along the surface normal.
        marker.quaternion.setFromUnitVectors(
            normalAxis,
            markerNormal
        );

        marker.visible = true;
    }

    function hideMarker() {
        marker.visible = false;
    }


    function fire(clientX, clientY, canvas) {
        const rect = canvas.getBoundingClientRect();

        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        const hits = raycaster.intersectObject(planet, false);
        if (hits.length === 0) return;

        const hit = hits[0];

        // Store the impact in the planet's local coordinates.
        // This ensures the effect follows the rotating planet.
        const localPoint = planet.worldToLocal(hit.point.clone());

        const normal = localPoint.clone().normalize();
        const projectile = new THREE.Mesh(
            projectileGeometry,
            new THREE.MeshBasicMaterial({
                color: 0x7565a7
            })
        );

        // Launch from a point near the camera.
        const start = camera.position.clone();

        // Aim toward the impact point.
        const end = hit.point.clone();

        projectile.position.copy(start);
        //scene.add(projectile);

        projectiles.push({
            mesh: projectile,
            start,
            end,
            localPoint,
            normal,
            elapsed: 0,
            duration: 0.35
        });
    }

    function createImpact(localPoint, normal) {
        const group = new THREE.Group();

        // Impact position is relative to the planet.
        group.position.copy(localPoint);

        // Align the shockwave with the surface normal.
        group.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            normal
        );

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.03, 0.08, 48),
            new THREE.MeshBasicMaterial({
                color: 0x7565a7,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );

        const flash = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 16, 16),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1,
                depthWrite: false
            })
        );

        group.add(ring, flash);

        // Parent the impact to the planet so it rotates with it.
        planet.add(group);

        impacts.push({
            group,
            ring,
            flash,
            elapsed: 0,
            duration: 0.65
        });
    }

    function update(delta) {

        if (marker.visible) {
            const time = performance.now() * 0.001;

            // Slight breathing effect.
            const pulse = 1 + Math.sin(time * 4) * 0.06;

            marker.scale.setScalar(pulse);
        }
        // Animate projectiles.
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const blast = projectiles[i];

            blast.elapsed += delta;

            const t = Math.min(blast.elapsed / blast.duration, 1);

            // Ease out.
            const eased = 1 - Math.pow(1 - t, 3);

            // Follow the moving planet's target position.
            const target = planet.localToWorld(blast.localPoint.clone());

            blast.mesh.position.lerpVectors(
                blast.start,
                target,
                eased
            );

            const scale = 1 + t * 1.5;
            blast.mesh.scale.setScalar(scale);

            if (t >= 1) {
                createImpact(blast.localPoint, blast.normal);

                scene.remove(blast.mesh);
                blast.mesh.material.dispose();

                projectiles.splice(i, 1);
            }
        }

        // Animate impact shockwaves.
        for (let i = impacts.length - 1; i >= 0; i--) {
            const impact = impacts[i];

            impact.elapsed += delta;

            const t = Math.min(impact.elapsed / impact.duration, 1);

            impact.ring.scale.setScalar(1 + t * 5);
            impact.ring.material.opacity = 1 - t;

            impact.flash.scale.setScalar(1 + t * 2);
            impact.flash.material.opacity = 1 - t;

            if (t >= 1) {
                planet.remove(impact.group);

                impact.ring.geometry.dispose();
                impact.ring.material.dispose();

                impact.flash.geometry.dispose();
                impact.flash.material.dispose();

                impacts.splice(i, 1);
            }
        }
    }

    function dispose() {
        for (const blast of projectiles) {
            scene.remove(blast.mesh);
            blast.mesh.material.dispose();
        }

        for (const impact of impacts) {
            planet.remove(impact.group);

            impact.ring.geometry.dispose();
            impact.ring.material.dispose();

            impact.flash.geometry.dispose();
            impact.flash.material.dispose();
        }
        planet.remove(marker);

        markerRing.geometry.dispose();
        markerDot.geometry.dispose();
        tickGeometry.dispose();
        markerMaterial.dispose();
        projectileGeometry.dispose();
        projectiles.length = 0;
        impacts.length = 0;
    }

    return {
        fire,
        hover,
        hideMarker,
        update,
        dispose
    };
}
