import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Provider } from "./provider";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <Provider>
        <html lang="en">
          <body className={cn(manrope.className, "antialiased")}>
            {children}
          </body>
        </html>
      </Provider>
    </ClerkProvider>
  );
}
