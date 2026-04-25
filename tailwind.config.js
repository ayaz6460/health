module.exports = {
  content: ["src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        breathe: "breathe 0.6s linear infinite alternate",
        scaleIn: "scaleIn 0.3s ease-out",
        slideInFromBottom: "slideInFromBottom 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
        slideInFromRight: "slideInFromRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
        shimmer: "shimmer 1.8s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        breathe: {
          "50%": { opacity: 0.4 },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      spacing: {
        "0": "0px",
        "0.5": "4px",
        "1": "8px",
        "2": "12px",
        "3": "16px",
        "4": "24px",
        "5": "28px",
        "6": "32px",
      },
      borderRadius: {
        pill: "100px",
        lg: "16px",
        xl: "20px",
      },
      colors: {
        accent: "#0071e3",
        up: "#34c759",
        down: "#ff3b30",
        warn: "#ff9500",
        text: {
          primary: "#1d1d1f",
          secondary: "#424245",
          muted: "#86868b",
          light: "#aeaeb2",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04)",
        card: "0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};