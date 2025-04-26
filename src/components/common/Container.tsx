import { cn } from "@/lib/utils";

type ContainerProps = React.ComponentProps<"section">;

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <section
      className={cn(
        "w-full max-w-[1500px] mx-auto px-2 sm:px-3 md:px-4 py-2 sm:py-4 md:py-6 bg-[#121313] flex justify-center",
        className
      )}
      {...props}
    >
      <div className="w-full">{children}</div>
    </section>
  );
}
