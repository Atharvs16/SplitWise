
export default function StepCard({
  number,
  title,
  description,
}) {
  return (
    <article className="step-card">
      <span className="step-number">{number}</span>

      <h3>{title}</h3>

      <p>{description}</p>
    </article>
  );
}
