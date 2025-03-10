import { cn } from "@/lib/utils";

type ContainerProps = React.ComponentProps<"section">;

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <section
      className={cn(
        "w-full max-w-full mx-auto px-3 sm:px-5 md:px-8 lg:px-12 py-2 sm:py-4 md:py-6 bg-[#121313]",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}
