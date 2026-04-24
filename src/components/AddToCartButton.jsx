import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleDashed, ShoppingBag } from "lucide-react";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * AddToCartButton — animated status button for adding items to cart.
 * Props:
 *   onAdd: async () => void — called when button is clicked; should perform cart addition logic
 *   label?: string — default button label (default: "Додати до кошика")
 *   addedLabel?: string — label after adding (default: "Додано до кошика")
 *   disabled?: boolean — when true button is inactive (e.g. out of stock)
 *   style?: object — additional styles for the button
 */
export default function AddToCartButton({
  onAdd,
  label = "Додати до кошика",
  addedLabel = "Додано до кошика",
  disabled = false,
  style = {},
}) {
  const [status, setStatus] = useState(null); // null | "loading" | "added"

  const isEnabled = !disabled && (!status || status === "idle");

  const handleClick = async () => {
    if (!isEnabled) return;
    setStatus("loading");
    try {
      await onAdd?.();
    } catch (e) {
      // If onAdd throws, just reset
      setStatus(null);
      return;
    }
    setStatus("added");
    await wait(1800);
    setStatus(null);
  };

  const currentLabel =
    status === "loading"
      ? null
      : status === "added"
        ? addedLabel
        : label;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || status === "loading" || status === "added"}
      style={{
        position: "relative",
        height: "3.25rem",
        minWidth: "12rem",
        overflow: "hidden",
        borderRadius: "9999px",
        backgroundColor: disabled ? "#ccc" : "#524f25",
        border: "none",
        color: "white",
        fontSize: "0.95rem",
        fontWeight: 500,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : status ? "default" : "pointer",
        transition: "background-color 0.3s ease, box-shadow 0.3s ease",
        width: "100%",
        marginTop: "1rem",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !status) {
          e.currentTarget.style.backgroundColor = "#43411e";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(82, 79, 37, 0.3)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = disabled ? "#ccc" : "#524f25";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status ?? "default"}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.1 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
        >
          {status === "loading" && (
            <CircleDashed size={18} style={{ animation: "spin 1s linear infinite" }} />
          )}

          {status === "added" && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              style={{ display: "flex", alignItems: "center" }}
            >
              <CheckCircle2
                size={18}
                style={{
                  fill: "white",
                  stroke: "#524f25",
                }}
              />
            </motion.span>
          )}

          {status !== "loading" && (
            <>
              {!status && <ShoppingBag size={18} />}
              {currentLabel}
            </>
          )}
        </motion.span>
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
