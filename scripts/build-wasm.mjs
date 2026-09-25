// Builds the playground's checker (the `ward_wasm` crate) from a local checkout of the
// wardscript repo into public/wasm/. Needs the wasm32-unknown-unknown target and a
// wasm-bindgen CLI matching the crate's wasm-bindgen version.
// Usage: node scripts/build-wasm.mjs [path-to-wardscript]  (default: ../wardscript)
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const src = resolve(process.argv[2] ?? "../wardscript");
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: "inherit" });
run("cargo", ["build", "-p", "ward_wasm", "--release", "--target", "wasm32-unknown-unknown"], src);
run("wasm-bindgen", [
  "--target", "web", "--out-dir", "public/wasm", "--out-name", "ward",
  join(src, "target/wasm32-unknown-unknown/release/ward_wasm.wasm"),
]);
console.log(`built public/wasm from ${src}`);
