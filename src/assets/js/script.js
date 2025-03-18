document.getElementById("trialForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent form from reloading the page

    // Get form data
    let name = document.getElementById("name").value;
    let phone = document.getElementById("phone").value;
    let message = document.getElementById("message").value || "No additional message";

    // Telegram Bot Credentials
    let botToken = "8066577405:AAGlFtASJysmT9qWAmK0izAzeVKIfUQSCX4"; // Replace with your bot token
    let chatId = "1068630342"; // Replace with your Chat ID

    // Message format
    let text = `📅 *New Trial Training Request* 🏋️‍♂️\n\n👤 *Name:* ${name}\n📞 *Phone:* ${phone}\n📝 *Message:* ${message}`;

    // Send message to Telegram
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "Markdown" })
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            document.getElementById("responseMessage").innerHTML = "<div class='alert alert-success'>✅ Request sent! I will contact you soon.</div>";
            document.getElementById("trialForm").reset();
        } else {
            document.getElementById("responseMessage").innerHTML = "<div class='alert alert-danger'>❌ Error sending request. Please try again.</div>";
        }
    })
    .catch(error => {
        console.error("Telegram API Error:", error);
        document.getElementById("responseMessage").innerHTML = "<div class='alert alert-danger'>⚠️ Failed to send request. Check your internet connection.</div>";
    });
});