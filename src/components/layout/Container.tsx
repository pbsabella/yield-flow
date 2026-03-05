import { cn } from "@/lib/utils"

const sizes = {
  sm:   "max-w-2xl",
  md:   "max-w-4xl",
  lg:   "max-w-5xl",
  full: "max-w-none",
}

interface ContainerProps extends React.ComponentProps<"div"> {
  size?: keyof typeof sizes
}

export function Container({ size = "lg", className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6", sizes[size], className)}
      {...props}
    />
  )
}
