export function Loader() {
  return (
    <div className="state">
      <span className="spinner" />
      <p>Собираем движуху…</p>
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="state error">
      <b>Не получилось загрузить</b>
      <p>{message}</p>
      {retry && (
        <button className="btn secondary" onClick={retry}>
          Попробовать снова
        </button>
      )}
    </div>
  );
}
export function EmptyState() {
  return (
    <div className="state empty">
      <span>🏃</span>
      <b>Ничего не нашли</b>
      <p>Попробуй изменить фильтры или создай свою движуху.</p>
    </div>
  );
}
