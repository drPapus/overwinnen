document.getElementById("trialForm").addEventListener("submit", function(event) {
    event.preventDefault();

    let name = document.getElementById("name").value;
    let phone = document.getElementById("phone").value;
    let message = document.getElementById("message").value || "No additional message";

    fetch("https://myworker.example.workers.dev", { // Replace with your actual Cloudflare Worker URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, phone: phone, message: message })
    })
    .then(response => response.text())
    .then(data => {
        document.getElementById("responseMessage").innerHTML = "<div class='alert alert-success'>✅ Request sent! I will contact you soon.</div>";
        document.getElementById("trialForm").reset();
    })
    .catch(error => {
        console.error("Error:", error);
        document.getElementById("responseMessage").innerHTML = "<div class='alert alert-danger'>❌ Failed to send request. Please try again.</div>";
    });
});

