import config from "../../tailwind.config";

/** @type {import('tailwindcss').Config} */
export default {
    ...config,
    content: ["../../src/**/*.{js,jsx,ts,tsx}", "../../tailwind.config.js", "./src/**/*.{js,jsx,ts,tsx}", "../../commons/src/**/*.{js,jsx,ts,tsx}"],
};
