const trialForm = document.getElementById("trialForm");
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
const mobileMenu = document.getElementById("mobileMenu");

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
