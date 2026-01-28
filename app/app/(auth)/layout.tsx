export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background" />
      <div className="relative z-10 w-full max-w-md p-4">{children}</div>
    </div>
  );
}
