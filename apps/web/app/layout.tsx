import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Provider } from "./provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <Provider>
        <html lang="en">
          <body className="antialiased">{children}</body>
        </html>
      </Provider>
    </ClerkProvider>
  );
}
