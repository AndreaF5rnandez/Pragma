import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pragma: {
          sidebar: '#3B302B',
          accent: '#8B5E3C',
          fondo: '#FAF8F5',
          superficie: '#E4DDCC',
          totales: '#5C3A1E',
          texto: '#1C1410',
          textoClaro: '#7A6A5A',
        },
      },
    },
  },
  plugins: [],
};

export default config;
