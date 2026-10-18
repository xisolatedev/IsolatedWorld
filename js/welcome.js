
const states = [ "hide-first", "hide-last"];



export function startWelcomeAnimation() {
    const title = document.getElementById("changing-world");
    if (!title) return;

    title.innerHTML = `
        <span class="word-part">
            <span class="word-text">Isolated</span>
            <span class="censor-bar">
                <span class="censor-label" style="left: 75%">My</span>
            </span> 
        </span><span class="word-part">
            <span class="word-text">World</span>
            <span class="censor-bar">
                <span class="censor-label">Universe</span>
            </span>
        </span>
    `;

    const parts = [...title.querySelectorAll(".word-part")];
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    // Compress long labels to fit their original word's width.
    function fitLabels() {
        parts.forEach(part => {
            const label = part.querySelector(".censor-label");
            const original = part.querySelector(".word-text");

            label.style.setProperty("--label-scale", 1);

            const available = original.getBoundingClientRect().width;
            const required = label.scrollWidth;

            const scale = Math.min(1, available / required);
            label.style.setProperty("--label-scale", scale);
        });
    }

  
    function showState(index) {
        parts.forEach((part, i) => {
            const isActive = i === index;

            if (isActive) {
                // Reset exit position before entering again.
                part.classList.remove("leaving");
                part.classList.add("redacted");
            } else if (part.classList.contains("redacted")) {
                // Animate the existing censor out.
                part.classList.remove("redacted");
                part.classList.add("leaving");
            }
        });
    }


    document.fonts.ready.then(fitLabels);
    window.addEventListener("resize", fitLabels);

    showState(0);

    if (reducedMotion) return;

    let index = 0;

    setInterval(() => {
        index = (index + 1) % states.length;
        showState(index);
    }, 3300);
}
