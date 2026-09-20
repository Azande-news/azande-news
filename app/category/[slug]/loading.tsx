export default function CategoryLoading() {
  return (
    <div className="animate-pulse">
      <div className="pb-6 mb-8 border-b-4 border-offwhite">
        <div className="h-9 w-64 bg-offwhite" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
        {[...Array(8)].map((_, i) => (
          <div key={i}>
            <div className="w-full aspect-[16/9] bg-offwhite mb-3" />
            <div className="h-5 w-full bg-offwhite mb-1.5" />
            <div className="h-4 w-3/4 bg-offwhite" />
          </div>
        ))}
      </div>
    </div>
  );
}
