function generateKey(password, salt) {
    return crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    ).then(key => {
        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            key,
            { name: "AES-CBC", length: 256 },
            true,
            ["encrypt"]
        );
    });
}

async function encryptMessage(message, password, timeLimitMinutes) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(16));

    const key = await generateKey(password, salt);

    const timestamp = Math.floor(Date.now() / 1000);
    const messageWithTimestamp = `${timestamp}:${timeLimitMinutes}:${message}`;

    const encodedMessage = new TextEncoder().encode(messageWithTimestamp);

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-CBC", iv },
        key,
        encodedMessage
    );

    const encryptedMessage = new Uint8Array([...salt, ...iv, ...new Uint8Array(encrypted)]);
    return btoa(String.fromCharCode(...encryptedMessage));
}

document.getElementById("encryptBtn").addEventListener("click", async () => {
    const message = document.getElementById("message").value;
    const password = document.getElementById("password").value;
    const timeLimit = document.getElementById("timeLimit").value;

    if (!message || !password || !timeLimit) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const encryptedMessage = await encryptMessage(message, password, timeLimit);
        document.getElementById("encryptedMessage").value = encryptedMessage;

        // Generate QR Code
        const qrcodeContainer = document.getElementById("qrcode");
        qrcodeContainer.innerHTML = ""; // Clear previous QR code
        new QRCode(qrcodeContainer, {
            text: encryptedMessage,
            width: 128,
            height: 128,
        });
    } catch (error) {
        console.error("Encryption failed:", error);
        alert("Encryption failed. Please try again.");
    }
});