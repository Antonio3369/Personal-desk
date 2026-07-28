export type PhoneRegion = "CN" | "HK";

export function normalizePhone(
  region: PhoneRegion,
  input: string,
): string | null {
  const digits = input.replace(/\D/g, "");

  if (region === "CN") {
    if (!/^1[3-9]\d{9}$/.test(digits)) return null;
    return digits;
  }

  const local = digits.startsWith("852") ? digits.slice(3) : digits;
  if (!/^[5-9]\d{7}$/.test(local)) return null;
  return `852${local}`;
}

export function formatPhoneDisplay(phone: string, region: PhoneRegion): string {
  if (region === "CN") {
    return phone;
  }

  const local = phone.startsWith("852") ? phone.slice(3) : phone;
  if (local.length === 8) {
    return `+852 ${local.slice(0, 4)} ${local.slice(4)}`;
  }
  return `+852 ${local}`;
}

export function parsePhoneRegion(value: string): PhoneRegion | null {
  return value === "CN" || value === "HK" ? value : null;
}
