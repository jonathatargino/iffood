interface ReviewStoreInfoProps {
  storeName: string;
  storePhotoUrl: string;
  reviewRequestCreatedAt: Date;
}

export function ReviewStoreInfo({
  storeName,
  storePhotoUrl,
  reviewRequestCreatedAt,
}: ReviewStoreInfoProps) {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-fit flex-col items-center p-6">
        <img
          src={storePhotoUrl}
          alt={`${storeName} photo`}
          className="mb-2 h-16 w-16 rounded-full object-cover"
        />
        <h2 className="font-semibold">{storeName}</h2>
        <p className="text-xs text-gray-500">
          {reviewRequestCreatedAt.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
