const trialForm = document.getElementById("trialForm");

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
