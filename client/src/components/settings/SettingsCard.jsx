/** Panel layout shared by the Data Management actions. */
export default function SettingsCard({ icon: Icon, tone, title, description, children }) {
  return (
    <section className="panel">
      <div className="panel__body d-flex flex-column gap-3 h-100">
        <div className="d-flex gap-3 align-items-start">
          <span className={`stat-card__icon tone-${tone}`} aria-hidden="true">
            <Icon />
          </span>
          <div>
            <h2 className="panel__title">{title}</h2>
            <p className="panel__subtitle">{description}</p>
          </div>
        </div>
        <div className="mt-auto">{children}</div>
      </div>
    </section>
  );
}
