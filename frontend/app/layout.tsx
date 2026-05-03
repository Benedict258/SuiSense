import "./globals.css";

export const metadata = {
  title: "SolSense",
  description: "Human-readable explanations for blockchain transactions and program errors"
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
