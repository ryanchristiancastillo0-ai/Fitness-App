const Icon = ({ name, className = '', fill = 0, weight = 300 }) => (
  <span
    className={`material-symbols-outlined leading-none select-none ${className}`}
    style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24` }}
  >
    {name}
  </span>
);

export default Icon;
