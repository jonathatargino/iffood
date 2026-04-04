interface StoreInfoBadgeProps {
  photoUrl: string;
  name: string;
  isStoreAvailable?: boolean;
}

export function StoreInfoBadge({
  photoUrl,
  name,
  isStoreAvailable = true,
}: StoreInfoBadgeProps) {
  return (
    <div
      className={`flex items-center rounded-full border bg-white p-6 py-1 pr-3 pl-1`}
    >
      <img src={photoUrl} alt={name} className="mr-2 h-10 w-10 rounded-full" />
      <div className="text-xs">
        <span className="font-bold">{name}</span>
        <br />
        <span
          className={`text-xs ${isStoreAvailable ? "text-green-700" : "text-red-700"}`}
        >
          {isStoreAvailable ? "Aberto agora" : "Fechado"}
        </span>
      </div>
    </div>
  );
}
