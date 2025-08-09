export function VisuallyHidden({ children, as: As = 'label', ...props }: any) {
  return (
    <As {...props} className={`sr-only ${props.className || ''}`.trim()}>
      {children}
    </As>
  )
}

