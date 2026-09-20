export default function PostLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-10 animate-pulse">
      <div className="lg:col-span-8">
        <div className="max-w-read">
          <div className="h-9 w-full bg-offwhite mb-2" />
          <div className="h-9 w-2/3 bg-offwhite mb-6" />
          <div className="h-4 w-40 bg-offwhite mb-1" />
          <div className="h-4 w-56 bg-offwhite mb-8" />
        </div>
        <div className="w-full aspect-[16/9] bg-offwhite mb-8" />
        <div className="max-w-read space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 w-full bg-offwhite" />
          ))}
        </div>
      </div>
      <div className="lg:col-span-4 lg:border-l lg:border-rule lg:pl-8 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-6 w-full bg-offwhite" />
        ))}
      </div>
    </div>
  );
}
