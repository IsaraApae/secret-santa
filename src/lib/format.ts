/** Shared by the pages and the link-preview images, which render on the server. */
export const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { dateStyle: "long" });

export const baht = (n: number) => `฿${n.toLocaleString("en-US")}`;

/** Thai text needs more room above it in script: Charm stacks its tone marks well over the line. */
export const hasThai = (text: string) => /\p{Script=Thai}/u.test(text);
