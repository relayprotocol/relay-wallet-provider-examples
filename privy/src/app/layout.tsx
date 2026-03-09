import "./globals.css";
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Privy x Relay</title>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
