/**
 * Utility untuk membedah user-agent string menjadi nama peramban dan sistem operasi yang mudah dibaca.
 */
export function parseUserAgent(uaString?: string | null): {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown";
} {
  if (!uaString || uaString === "unknown") {
    return { browser: "Peramban Web", os: "Sistem Tidak Dikenal", deviceType: "unknown" };
  }

  let browser = "Web Browser";
  let os = "Perangkat";
  let deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown" = "desktop";

  // Deteksi OS
  if (/windows phone/i.test(uaString)) {
    os = "Windows Phone";
    deviceType = "mobile";
  } else if (/win(dows|98|nt|2000|xp|7|8|10|11)/i.test(uaString)) {
    os = "Windows";
    deviceType = "desktop";
  } else if (/android/i.test(uaString)) {
    os = "Android";
    deviceType = /tablet/i.test(uaString) ? "tablet" : "mobile";
  } else if (/ipad/i.test(uaString)) {
    os = "iPadOS";
    deviceType = "tablet";
  } else if (/iphone|ipod/i.test(uaString)) {
    os = "iOS";
    deviceType = "mobile";
  } else if (/macintosh|mac os x/i.test(uaString)) {
    os = "macOS";
    deviceType = "desktop";
  } else if (/linux/i.test(uaString)) {
    os = "Linux";
    deviceType = "desktop";
  }

  // Deteksi Browser
  if (/edg\//i.test(uaString)) {
    browser = "Microsoft Edge";
  } else if (/opr\/|opera/i.test(uaString)) {
    browser = "Opera";
  } else if (/chrome|crios/i.test(uaString)) {
    browser = "Google Chrome";
  } else if (/firefox|fxios/i.test(uaString)) {
    browser = "Mozilla Firefox";
  } else if (/safari/i.test(uaString) && !/chrome/i.test(uaString)) {
    browser = "Apple Safari";
  } else if (/curl|postman|insomnia|httpie/i.test(uaString)) {
    browser = "API Client";
  }

  return { browser, os, deviceType };
}
