export default function LiveLoading() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      <div className="h-4 w-16 bg-offwhite mb-8" />
      <div className="space-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-offwhite" />
        ))}
      </div>
    </div>
  );
}

