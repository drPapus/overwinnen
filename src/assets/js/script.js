const trialForm = document.getElementById("trialForm");
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
const mobileMenu = document.getElementById("mobileMenu");
const aimHero = document.querySelector(".hero-section");
const aimConnectionSvg = document.querySelector(".aim-connections");

if (aimHero && aimConnectionSvg) {
    const cards = aimHero.querySelectorAll("[data-aim-card]");
    const targets = {
        assessment: [0.65, 0.51],
        adaptation: [0.59, 0.47],
        performance: [0.655, 0.62],
        recovery: [0.665, 0.72]
    };
    let connectionFrame = 0;

    const updateAimConnections = () => {
        cancelAnimationFrame(connectionFrame);
        connectionFrame = requestAnimationFrame(() => {
            if (window.innerWidth <= 720) return;

            const heroRect = aimHero.getBoundingClientRect();
            aimConnectionSvg.setAttribute("viewBox", `0 0 ${heroRect.width} ${heroRect.height}`);

            cards.forEach((card) => {
                const name = card.dataset.aimCard;
                const group = aimConnectionSvg.querySelector(`[data-aim-path="${name}"]`);
                const target = targets[name];
                if (!group || !target) return;

                const cardRect = card.getBoundingClientRect();
                const cardX = cardRect.left - heroRect.left + cardRect.width / 2;
                const cardY = cardRect.top - heroRect.top + cardRect.height / 2;
                const endX = heroRect.width * target[0];
                const endY = heroRect.height * target[1];
                const deltaX = endX - cardX;
                const deltaY = endY - cardY;
                const distance = Math.hypot(deltaX, deltaY) || 1;
                const radius = Math.min(cardRect.width, cardRect.height) / 2;
                const startX = cardX + (deltaX / distance) * radius;
                const startY = cardY + (deltaY / distance) * radius;
                const bend = Math.min(Math.abs(deltaX) * 0.42, 170);
                const direction = Math.sign(deltaX) || 1;
                const controlX1 = startX + bend * direction;
                const controlX2 = endX - bend * direction * 0.55;
                const pathData = `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;

                group.querySelectorAll("path").forEach((path) => path.setAttribute("d", pathData));
                group.querySelector(".aim-connection-anchor").setAttribute("cx", startX);
                group.querySelector(".aim-connection-anchor").setAttribute("cy", startY);

                const gradient = aimConnectionSvg.querySelector(`#aim-gradient-${name}`);
                gradient.setAttribute("x1", startX);
                gradient.setAttribute("y1", startY);
                gradient.setAttribute("x2", endX);
                gradient.setAttribute("y2", endY);
                group.querySelector(".aim-connection-base").setAttribute("stroke", `url(#aim-gradient-${name})`);
            });
        });
    };

    const setActiveConnection = (card, active) => {
        const name = card?.closest("[data-aim-card]")?.dataset.aimCard;
        if (!name) return;
        aimConnectionSvg.querySelector(`[data-aim-path="${name}"]`)?.classList.toggle("is-active", active);
    };

    aimHero.addEventListener("pointerover", (event) => {
        const card = event.target.closest("[data-aim-card]");
        if (card && !card.contains(event.relatedTarget)) setActiveConnection(card, true);
    });
    aimHero.addEventListener("pointerout", (event) => {
        const card = event.target.closest("[data-aim-card]");
        if (card && !card.contains(event.relatedTarget)) setActiveConnection(card, false);
    });
    aimHero.addEventListener("focusin", (event) => setActiveConnection(event.target, true));
    aimHero.addEventListener("focusout", (event) => setActiveConnection(event.target, false));
    window.addEventListener("resize", updateAimConnections, { passive: true });
    window.addEventListener("orientationchange", updateAimConnections, { passive: true });
    window.addEventListener("load", updateAimConnections, { once: true });
    updateAimConnections();
}

if (mobileMenuToggle && mobileMenu) {
    const mobileMenuLinks = mobileMenu.querySelectorAll("a");

    const closeMobileMenu = () => {
        mobileMenu.classList.remove("is-open");
        mobileMenuToggle.setAttribute("aria-expanded", "false");
        mobileMenuToggle.setAttribute("aria-label", "Menu openen");
    };

    const openMobileMenu = () => {
        mobileMenu.classList.add("is-open");
        mobileMenuToggle.setAttribute("aria-expanded", "true");
        mobileMenuToggle.setAttribute("aria-label", "Menu sluiten");
    };

    mobileMenuToggle.addEventListener("click", function(event) {
        event.stopPropagation();

        if (mobileMenu.classList.contains("is-open")) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    mobileMenu.addEventListener("click", function(event) {
        event.stopPropagation();
    });

    mobileMenuLinks.forEach(function(link) {
        link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("click", closeMobileMenu);

    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape" && mobileMenu.classList.contains("is-open")) {
            closeMobileMenu();
            mobileMenuToggle.focus();
        }
    });

    window.addEventListener("resize", function() {
        if (window.innerWidth > 992) {
            closeMobileMenu();
        }
    });
}

if (trialForm) {
    trialForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const message = document.getElementById("message").value.trim() || "Geen extra bericht";
        const responseMessage = document.getElementById("responseMessage");

        if (!name || !phone) {
            responseMessage.innerHTML = "<div class='alert alert-danger'>Vul je naam en telefoonnummer in.</div>";
            return;
        }

        fetch("https://overwinnen.antonklimovv.workers.dev/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name, phone: phone, message: message })
        })
            .then(response => response.text())
            .then(data => {
                if (data.includes("Message sent")) {
                    responseMessage.innerHTML = "<div class='alert alert-success'>Aanvraag verstuurd. Ik neem binnenkort contact met je op.</div>";
                    trialForm.reset();
                } else {
                    responseMessage.innerHTML = "<div class='alert alert-danger'>Versturen is niet gelukt. Probeer het opnieuw.</div>";
                }
            })
            .catch(error => {
                console.error("Error:", error);
                responseMessage.innerHTML = "<div class='alert alert-danger'>Versturen is niet gelukt. Controleer je verbinding en probeer opnieuw.</div>";
            });
    });
}
