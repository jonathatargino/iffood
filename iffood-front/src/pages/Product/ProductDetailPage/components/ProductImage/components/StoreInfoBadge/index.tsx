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
      className={`pl-1 pr-3 py-1 rounded-full backdrop-blur-md bg-white/70 border border-white/20 shadow-lg p-6 flex items-center`}
    >
      <img src={photoUrl} alt={name} className="w-10 h-10 rounded-full mr-2" />
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
