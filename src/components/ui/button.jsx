// frontend/src/components/ui/button.jsx
import React from "react";

// ================================
// 🛠 Helper function
// ================================
const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

// ================================
// 🎨 GET BUTTON CLASSES
// ================================
const getButtonClasses = ({
  variant = "default",
  size = "default",
  fullWidth = false,
  className = "",
}) => {
  const variants = {
    default: "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:from-purple-600 hover:to-pink-600 hover:shadow-xl",
    primary: "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:from-purple-600 hover:to-pink-600 hover:shadow-xl",
    secondary: "bg-gray-700 text-gray-200 hover:bg-gray-600 shadow-md",
    destructive: "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg hover:from-red-600 hover:to-rose-600 hover:shadow-xl",
    success: "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:from-green-600 hover:to-emerald-600 hover:shadow-xl",
    warning: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg hover:from-yellow-600 hover:to-orange-600 hover:shadow-xl",
    outline: "border-2 border-purple-500 bg-transparent text-purple-400 hover:bg-purple-500/10 hover:text-purple-300",
    outlineDestructive: "border-2 border-red-500 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300",
    outlineSuccess: "border-2 border-green-500 bg-transparent text-green-400 hover:bg-green-500/10 hover:text-green-300",
    ghost: "bg-transparent text-gray-300 hover:bg-white/10 hover:text-white",
    ghostDanger: "bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300",
    premium: "bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white shadow-xl hover:shadow-2xl animate-pulse",
  };

  const sizes = {
    default: "h-10 px-5 py-2",
    xs: "h-7 px-2 text-xs rounded-lg",
    sm: "h-8 px-3 text-sm rounded-lg",
    md: "h-10 px-5 py-2",
    lg: "h-11 px-6 text-base",
    xl: "h-12 px-7 text-lg",
    icon: "h-10 w-10",
    "icon-sm": "h-8 w-8",
    "icon-lg": "h-12 w-12",
  };

  const baseClasses = "inline-flex justify-center items-center gap-2 disabled:opacity-50 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black [&_svg]:size-4 font-medium text-sm whitespace-nowrap active:scale-95 transition-all duration-200 [&_svg]:pointer-events-none disabled:pointer-events-none [&_svg]:shrink-0";
  
  const variantClass = variants[variant] || variants.default;
  const sizeClass = sizes[size] || sizes.default;
  const widthClass = fullWidth ? "w-full" : "";

  return cn(baseClasses, variantClass, sizeClass, widthClass, className);
};

// ================================
// 🔄 BUTTON COMPONENT
// ================================
const Button = React.forwardRef(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      asChild = false,
      loading = false,
      loadingText = "Loading...",
      icon = null,
      iconPosition = "left",
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const getSpinnerColor = () => {
      if (variant === "outline" || variant === "outlineDestructive" || variant === "outlineSuccess") {
        return "border-current";
      }
      if (variant === "ghost" || variant === "ghostDanger") {
        return "border-gray-400 border-t-transparent";
      }
      return "border-white/30 border-t-white";
    };

    // Handle asChild prop
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(
          getButtonClasses({ variant, size, fullWidth, className }),
          "relative overflow-hidden",
          isDisabled && "cursor-not-allowed"
        ),
        disabled: isDisabled,
        ref,
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        className={cn(
          getButtonClasses({ variant, size, fullWidth, className }),
          "relative overflow-hidden",
          isDisabled && "cursor-not-allowed"
        )}
        disabled={isDisabled}
        {...props}
      >
        {/* Loading Overlay */}
        {loading && (
          <span className="absolute inset-0 flex justify-center items-center bg-inherit">
            <svg
              className={cn("w-4 h-4 animate-spin", getSpinnerColor())}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Loading"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText && <span className="ml-2">{loadingText}</span>}
          </span>
        )}

        {/* Button Content */}
        <span className={cn("flex justify-center items-center gap-2", loading && "opacity-0")}>
          {icon && iconPosition === "left" && icon}
          {children}
          {icon && iconPosition === "right" && icon}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

// ================================
// 🧩 ICON BUTTON
// ================================
const IconButton = React.forwardRef(({ icon: Icon, label, size = "icon", ...props }, ref) => {
  return (
    <Button ref={ref} size={size} {...props}>
      {Icon && <Icon size={18} />}
      {label && <span className="sr-only">{label}</span>}
    </Button>
  );
});
IconButton.displayName = "IconButton";

// ================================
// 🧩 SOCIAL BUTTON
// ================================
const SocialButton = React.forwardRef(({ provider, children, ...props }, ref) => {
  const socialConfig = {
    google: {
      icon: "🔵",
      label: "Google",
      className: "bg-white/10 hover:bg-white/20 text-white border border-white/20",
    },
    facebook: {
      icon: "📘",
      label: "Facebook",
      className: "bg-[#1877f2] hover:bg-[#1877f2]/90 text-white",
    },
    twitter: {
      icon: "🐦",
      label: "Twitter",
      className: "bg-[#1da1f2] hover:bg-[#1da1f2]/90 text-white",
    },
    github: {
      icon: "🐙",
      label: "GitHub",
      className: "bg-[#333] hover:bg-[#333]/90 text-white",
    },
  };

  const config = socialConfig[provider] || socialConfig.google;

  return (
    <Button ref={ref} variant="outline" className={config.className} {...props}>
      <span className="text-lg">{config.icon}</span>
      {children || `Continue with ${config.label}`}
    </Button>
  );
});
SocialButton.displayName = "SocialButton";

// ================================
// 🧩 LOADING BUTTON
// ================================
const LoadingButton = React.forwardRef(({ children, loadingText = "Loading...", ...props }, ref) => {
  return (
    <Button ref={ref} loading={true} loadingText={loadingText} {...props}>
      {children}
    </Button>
  );
});
LoadingButton.displayName = "LoadingButton";

export { Button, IconButton, SocialButton, LoadingButton };