export default function PostLoading() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 min-w-0">
          <div className="h-3 w-24 bg-offwhite mb-3" />
          <div className="h-10 w-3/4 bg-offwhite mb-4" />
          <div className="h-4 w-40 bg-offwhite mb-8" />
          <div className="w-full h-72 sm:h-96 bg-offwhite mb-8" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-offwhite" />
            <div className="h-4 w-full bg-offwhite" />
            <div className="h-4 w-5/6 bg-offwhite" />
            <div className="h-4 w-full bg-offwhite" />
            <div className="h-4 w-2/3 bg-offwhite" />
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="h-3 w-20 bg-offwhite mb-3" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-offwhite" />
            <div className="h-4 w-full bg-offwhite" />
            <div className="h-4 w-3/4 bg-offwhite" />
          </div>
        </div>
      </div>
    </div>
  );
}

