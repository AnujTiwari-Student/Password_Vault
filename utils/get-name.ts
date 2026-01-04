export function getNameFromEmail(email: string): string {
  if (!email) return "User";
  const namePart = email.split("@")[0];
  return namePart
    .replace(/[._-]/g, " ") 
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
