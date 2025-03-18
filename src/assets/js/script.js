document.getElementById("trialForm").addEventListener("submit", function(event) {
    event.preventDefault();

    let name = document.getElementById("name").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let message = document.getElementById("message").value.trim() || "No additional message";

    // ✅ Ensure all fields are filled
    if (!name || !phone || !message) {
        alert("❌ Please fill in all fields.");
        return;
    }

    fetch("https://overwinnen.antonklimovv.workers.dev/", { // Replace with your actual Worker URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, phone: phone, message: message })
    })
    .then(response => response.text())
    .then(data => {
        if (data.includes("Message sent")) {
            document.getElementById("responseMessage").innerHTML = "<div class='alert alert-success'>✅ Request sent! I will contact you soon.</div>";
            document.getElementById("trialForm").reset();
        } else {
            document.getElementById("responseMessage").innerHTML = "<div class='alert alert-danger'>❌ Failed to send request.</div>";
        }
    })
    .catch(error => {
        console.error("Error:", error);
        document.getElementById("responseMessage").innerHTML = "<div class='alert alert-danger'>❌ Failed to send request. Check console.</div>";
    });
});

