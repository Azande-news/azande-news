import { formatSmartDate } from "@/lib/time";

export default function SmartTime({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
  return (
    <time dateTime={iso} className={className}>
      {formatSmartDate(iso)}
    </time>
  );
}
