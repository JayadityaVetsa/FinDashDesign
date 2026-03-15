import Script from "next/script";

const themeInitScript = `
  (function () {
    try {
      var stored = localStorage.getItem("findash-theme");
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var theme = stored ? stored : "dark";
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {}
  })();
`;

export default function ThemeScript() {
  return (
    <Script
      id="theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
    />
  );
}
