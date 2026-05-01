// frontend/src/components/ui/Button.jsx
import clsx from "clsx";
import { forwardRef } from "react";

const Button = forwardRef(
  (
    {
      children,
      className = "",
      loading = false,
      disabled = false,
      variant = "primary",
      size = "md",
      type = "button",
      fullWidth = false,
      icon = null,
      iconPosition = "left",
      onClick,
      ...props
    },
    ref
  ) => {
    // =========================
    // 🎨 VARIANTS
    // =========================
    const variants = {
      // Solid variants
      primary: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl",
      secondary: "bg-gray-700 hover:bg-gray-600 text-white",
      danger: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl",
      success: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl",
      warning: "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl",
      
      // Outline variants
      outline: "border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white transition-all duration-200",
      outlineDanger: "border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200",
      outlineSuccess: "border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-200",
      
      // Ghost variants
      ghost: "hover:bg-white/10 text-gray-300 hover:text-white transition-all duration-200",
      ghostDanger: "hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200",
      
      // Special
      premium: "bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white shadow-xl hover:shadow-2xl animate-pulse",
    };

    // =========================
    // 📏 SIZES
    // =========================
    const sizes = {
      xs: "px-2 py-1 text-xs rounded-lg",
      sm: "px-3 py-1.5 text-sm rounded-lg",
      md: "px-5 py-2.5 text-base rounded-xl",
      lg: "px-7 py-3.5 text-lg rounded-xl",
      xl: "px-9 py-4 text-xl rounded-2xl",
    };

    // =========================
    // 🔄 LOADING STATES
    // =========================
    const loadingSpinners = {
      primary: "border-white border-t-transparent",
      secondary: "border-white border-t-transparent",
      danger: "border-white border-t-transparent",
      success: "border-white border-t-transparent",
      warning: "border-white border-t-transparent",
      outline: "border-purple-500 border-t-transparent",
      outlineDanger: "border-red-500 border-t-transparent",
      outlineSuccess: "border-green-500 border-t-transparent",
      ghost: "border-gray-400 border-t-transparent",
      ghostDanger: "border-red-400 border-t-transparent",
      premium: "border-white border-t-transparent",
    };

    const spinnerColor = loadingSpinners[variant] || loadingSpinners.primary;

    // =========================
    // 🎯 HANDLE CLICK
    // =========================
    const handleClick = (e) => {
      if (disabled || loading) return;
      if (onClick) onClick(e);
    };

    return (
      <button
        ref={ref}
        type={type}
        {...props}
        disabled={disabled || loading}
        onClick={handleClick}
        className={clsx(
          "relative flex justify-center items-center gap-2 font-semibold transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black",
          "active:scale-95 transform",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          (disabled || loading) && "opacity-60 cursor-not-allowed active:scale-100",
          className
        )}
      >
        {/* Loading Overlay */}
        {loading && (
          <span className="absolute inset-0 flex justify-center items-center bg-inherit rounded-inherit">
            <div className={clsx("border-2 rounded-full w-5 h-5 animate-spin", spinnerColor)} />
          </span>
        )}

        {/* Content */}
        <span className={clsx("flex items-center gap-2", loading && "opacity-0")}>
          {icon && iconPosition === "left" && icon}
          {children}
          {icon && iconPosition === "right" && icon}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

// =========================
// 🧩 SUB-COMPONENTS
// =========================
export const IconButton = ({ icon: Icon, label, ...props }) => {
  return (
    <Button {...props}>
      <Icon size={18} />
      {label && <span>{label}</span>}
    </Button>
  );
};

export const SocialButton = ({ provider, ...props }) => {
  const socialVariants = {
    google: "bg-white/10 hover:bg-white/20 text-white",
    facebook: "bg-blue-600 hover:bg-blue-700 text-white",
    twitter: "bg-sky-500 hover:bg-sky-600 text-white",
    github: "bg-gray-800 hover:bg-gray-700 text-white",
  };

  const socialIcons = {
    google: "🔵",
    facebook: "📘",
    twitter: "🐦",
    github: "🐙",
  };

  return (
    <Button
      variant="outline"
      className={socialVariants[provider]}
      {...props}
    >
      <span className="text-xl">{socialIcons[provider]}</span>
      Continue with {provider.charAt(0).toUpperCase() + provider.slice(1)}
    </Button>
  );
};

export default Button;