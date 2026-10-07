
const themeInitScript = `
  (function () {
    try {
      var stored = localStorage.getItem("findash-theme");
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
    <script
      id="theme-init"
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
    />
  );
}
