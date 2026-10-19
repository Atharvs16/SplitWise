
export default function FeatureCard({
  icon: Icon,
  title,
  description,
  number,
}) {
  return (
    <article className="feature-card">
      <div className="feature-card-top">
        <span className="feature-icon">
          <Icon size={24} strokeWidth={1.8} />
        </span>

        <span className="feature-number">{number}</span>
      </div>

      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}
