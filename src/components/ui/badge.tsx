export function Badge({
  children,
  color = "green",
}: {
  children: React.ReactNode;
  color?: "green" | "gray" | "red";
}) {
  const colors = {
    green: "bg-military-green-light/40 text-military-green-dark",
    gray: "bg-gray-200 text-gray-600",
    red: "bg-red-100 text-red-700",
  };

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}
