export async function isCorrect(encryptedData, password) {
  return (await decrypt(encryptedData, password)) == "correct";
}

export async function decrypt(encryptedData, password) {
  try {
    const salt = base64ToBytes(encryptedData.salt);

    const key = await getKey(password, salt);

    const iv = base64ToBytes(encryptedData.iv);

    const cipher = base64ToBytes(encryptedData.cipher);

    const contentBytes = new Uint8Array(
      await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher),
    );

    return bytesToString(contentBytes);
  } catch (err) {
    return "";
  }
}

async function getKey(password, salt) {
  const passwordBytes = stringToBytes(password);

  const initialKey = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    initialKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function bytesToString(bytes) {
  return new TextDecoder().decode(bytes);
}

function base64ToBytes(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function stringToBytes(str) {
  return new TextEncoder().encode(str);
}
