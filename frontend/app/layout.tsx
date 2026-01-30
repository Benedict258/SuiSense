import "./globals.css";

export const metadata = {
  title: "SuiSense",
  description: "Human-readable explanations for Sui transactions and Move errors"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
