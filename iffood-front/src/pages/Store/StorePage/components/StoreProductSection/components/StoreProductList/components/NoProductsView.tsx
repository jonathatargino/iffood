export function NoAvailableProductsView() {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-gray-100">
        <svg
          className="h-10 w-10 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M20 7h-4m0 10v-5m0 0V7m0 5h5m-5 0H8m12-6.74V17a2 2 0 01-2 2H6a2 2 0 01-2-2V4.26A1 1 0 014.74 3H6a2 2 0 012 2v1h8V5a2 2 0 012-2h1.26a1 1 0 01.74 1.26z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </div>
      <p className="mb-1 text-gray-500">Nenhum produto disponível</p>
      <p className="text-sm text-gray-400">
        Esta loja ainda não cadastrou produtos
      </p>
    </div>
  );
}
