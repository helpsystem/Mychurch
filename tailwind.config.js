/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./frontend/index.html",
        "./frontend/src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                poppins: ['Poppins', 'sans-serif'],
                vazir: ['Vazirmatn', 'sans-serif'],
                serif: ['Georgia', 'Times New Roman', 'serif'],
            },
            colors: {
                primary: "#00040F",
                secondary: "#00F6FF",
                dimWhite: "rgba(255, 255, 255, 0.7)",
                dimBlue: "rgba(9, 151, 124, 0.1)",
            },
            boxShadow: {
                'card': '0px 20px 100px -10px rgba(66, 71, 91, 0.1)',
            },
        },
    },
    plugins: [],
}
