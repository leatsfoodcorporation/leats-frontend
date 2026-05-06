// tailwind.config.js
/** @type {import('tailwindcss').Config} */
const config = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['var(--font-poppins)', 'sans-serif'],
        },
        screens: {
          'xs': '375px',  // Extra small devices (small phones)
          // sm: '640px' (default)
          // md: '768px' (default)
          // lg: '1024px' (default)
          // xl: '1280px' (default)
          // 2xl: '1536px' (default)
        },
      },
    },
    plugins: [],
  };
  
  export default config;