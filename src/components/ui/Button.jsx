import React from 'react'

export function Button({ children, className = '', variant = 'default', size = 'default', ...props }) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none disabled:opacity-50'
  
  const variants = {
    default: 'bg-purple-600 text-white hover:bg-purple-700',
    ghost: 'bg-transparent hover:bg-white/20',
    outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50'
  }
  
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-12 px-6 text-lg',
    icon: 'h-10 w-10'
  }

  const classes = baseStyles + ' ' + variants[variant] + ' ' + sizes[size] + ' ' + className

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button