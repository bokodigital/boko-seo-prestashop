import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["400","500","600","700","800","900"], variable: "--font-poppins", display: "swap" });

export const metadata = {
  title: "Boko - PrestaShop SEO Meta Studio",
  description: "Generate meta titles & descriptions for your PrestaShop CMS pages, products and categories.",
};

export default function RootLayout({ children }) {
  return (<html lang="en" className={poppins.variable}><body>{children}</body></html>);
}
