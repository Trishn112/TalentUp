import Prism from "prismjs";

// Prism components expect a global Prism object in ESM environments.
// We set this here so that subsequent imports of Prism components can find it.
if (typeof window !== "undefined") {
  // @ts-ignore
  window.Prism = Prism;
}

export default Prism;
