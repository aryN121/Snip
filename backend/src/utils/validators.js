function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}

function isValidSlug(s) {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(s);
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}


export {
    isValidEmail,
    isValidSlug,
    isValidUrl
};