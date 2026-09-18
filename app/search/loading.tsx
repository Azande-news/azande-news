export default function SearchLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-11 w-full max-w-xl bg-offwhite mb-8" />
      <div className="h-3 w-32 bg-offwhite mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <div className="w-full h-40 bg-offwhite mb-3" />
            <div className="h-3 w-20 bg-offwhite mb-1.5" />
            <div className="h-5 w-full bg-offwhite mb-1.5" />
            <div className="h-4 w-3/4 bg-offwhite" />
          </div>
        ))}
      </div>
    </div>
  );
}

