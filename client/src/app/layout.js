import { Mulish, Oxanium } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";

const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-mulish",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-oxanium",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "PharmaGuard — AI-Powered Pharmacogenomic Risk Analysis",
  description:
    "Analyze patient genetic data (VCF files) to predict personalized drug risks and provide clinically actionable recommendations aligned with CPIC guidelines.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${mulish.variable} ${oxanium.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
