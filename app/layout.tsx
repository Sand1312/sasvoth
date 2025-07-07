import ClientRootLayoutContent from "./ClientRootLayoutContent";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientRootLayoutContent>{children}</ClientRootLayoutContent>
      </body>
    </html>
  );
}