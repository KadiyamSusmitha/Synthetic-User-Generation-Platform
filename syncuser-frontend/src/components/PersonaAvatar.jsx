function PersonaAvatar({
  personaId,
  name,
  size = "md",
}) {
  const seed = `${personaId}-${name}`;

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-28 w-28",
    xl: "h-36 w-36",
  };

  const imageSizes = {
    sm: 48,
    md: 64,
    lg: 112,
    xl: 144,
  };

  const imageSize = imageSizes[size] || imageSizes.md;

  const avatarUrl =
    `https://api.dicebear.com/10.x/personas/svg` +
    `?seed=${encodeURIComponent(seed)}` +
    `&size=${imageSize}`;

  return (
    <div
      className={`${sizeClasses[size] || sizeClasses.md} shrink-0 overflow-hidden rounded-full bg-[#eaf7f3]`}
    >
      <img
        src={avatarUrl}
        alt={`${name || "Persona"} avatar`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

export default PersonaAvatar;