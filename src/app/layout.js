import "./globals.css";

export const metadata = {
  title: "AI Text Humanizer",
  description: "Convert robotic AI text into natural human writing",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
