// Opens and closes the mobile menu.
export function setupNavigation() {
    const menuButton = document.querySelector(".menu-toggle");
    const navigation = document.querySelector(".site-nav");

    menuButton.addEventListener("click", () => {
        const menuIsOpen = navigation.classList.toggle("is-open");
        menuButton.setAttribute("aria-expanded", String(menuIsOpen));
        menuButton.setAttribute("aria-label", menuIsOpen ? "Close navigation" : "Open navigation");
    });

    for (const link of navigation.querySelectorAll("a")) {
        link.addEventListener("click", () => {
            navigation.classList.remove("is-open");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.setAttribute("aria-label", "Open navigation");
        });
    }
}
