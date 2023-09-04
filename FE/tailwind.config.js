/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        "primary-color": "#0064fe",
        "primary-shade-color": "#00388f",
        "primary-pale-color": "#e5effe",
        "primary-highlight-color": "#5c9bff",
        "text-pale-color": "#e5effe",
        "scrum-background-color": "#ffffff",
        "scrum-text-color": "#848b99",
        "scrum-button-inner-text": "#000e51",
        "scrum-button-inner-background": "#c7cce5",
        "scrum-landing-page-text": "#4f5ba6",
        "scrum-landing-text": "#000c45",
        logo: "#1c2939",
        "hover-color": "#b5beeb",
        "active-color": "#929fe0",
        "card-darkest": "#39458a",
        "card-dark-color": "#6974b1",
        "card-light": "#9da4cf",
        "main-text": "#3d4450",
      },
      animation: {
        "card-animation": "card 0.4s",
        "popin-animation": "popin 0.3s",
        "error-animation": "uptodown 0.3s",
      },
      keyframes: {
        card: {
          "0%": {
            transform: "translateY(-10px)",
            opacity: "0",
            backgroundColor: "#0f83f8",
          },
          "100%": {
            transform: "translateY(0%)",
            opacity: "100",
            backgroundColor: "#0f83f8",
          },
        },
        popin: {
          "0%": {
            transform: "scale(0)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
        uptodown: {
          "0%": {
            transform: "translateY(-10px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0%)",
            opacity: "100",
          },
        },
      },
      screens: {
        xs: { raw: "(min-width: 375px)", raw: "(max-width:639px)" },
        xxs: { raw: "(max-width: 376px)" },
      },
      fontFamily: {
        "card-points": ["Roboto Mono"],
        "card-font": ["Space Mono"],
        "main-text": ["Montserrat"],
        "inner-text": ["Roboto"],
        poppins: ["Poppins"],
        "main-textt": ["Noto Sans Chorasmian"],
      },
    },
  },
  plugins: [],
};
