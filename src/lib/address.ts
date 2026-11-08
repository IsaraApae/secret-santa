import { BlockList, isIP } from "node:net";

/**
 * Addresses a wish's link must never reach: this machine, the private network, the cloud's metadata
 * service, and the IPv6 forms that carry an IPv4 address inside them. BlockList also matches an IPv4
 * range when the address arrives IPv4-mapped (::ffff:7f00:1 is 127.0.0.1), the way URL writes it.
 */
const blocked = new BlockList();
for (const [net, bits] of [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // link-local, including the metadata service
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24], // documentation
  ["192.88.99.0", 24], // 6to4 relay
  ["192.168.0.0", 16],
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, and broadcast
] as const) {
  blocked.addSubnet(net, bits, "ipv4");
}
for (const [net, bits] of [
  ["::", 96], // unspecified, loopback and the old IPv4-compatible form (::7f00:1)
  ["64:ff9b::", 96], // NAT64: an IPv4 address inside
  ["64:ff9b:1::", 48],
  ["100::", 64], // discard
  ["2001::", 32], // Teredo
  ["2001:db8::", 32], // documentation
  ["2002::", 16], // 6to4: an IPv4 address inside
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["fec0::", 10], // old site-local
  ["ff00::", 8], // multicast
] as const) {
  blocked.addSubnet(net, bits, "ipv6");
}

/** True only for an address on the public internet. Anything unparseable counts as private. */
export function isPublicAddress(ip: string): boolean {
  const family = isIP(ip);
  if (!family) return false;
  return !blocked.check(ip, family === 4 ? "ipv4" : "ipv6");
}

/**
 * What can be known about a link before any lookup: web links on the usual ports only, and a host
 * written as an address must be a public one. Names are checked when they're looked up, on the
 * connection itself, so a name can't answer differently the second time.
 */
export function mayFetch(url: URL): boolean {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.port && url.port !== "80" && url.port !== "443") return false;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  return !isIP(host) || isPublicAddress(host);
}
