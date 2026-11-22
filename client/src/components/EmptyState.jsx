export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
