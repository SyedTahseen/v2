export function cn(...classes: any[]) {
  return classes
    .filter(Boolean)
    .map((c) => {
      if (typeof c === "object" && c !== null) {
        return Object.keys(c)
          .filter((key) => c[key])
          .join(" ");
      }
      return String(c);
    })
    .join(" ");
}
