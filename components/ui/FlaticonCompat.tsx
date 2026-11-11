import React from "react";
import Flaticon, { FlaticonProps } from "./Flaticon";

export interface CompatIconProps extends Omit<FlaticonProps, "name"> {
  size?: number | string;
  strokeWidth?: number;
}

function createFlaticonWrapper(iconName: string) {
  const Comp = React.forwardRef<HTMLElement, CompatIconProps>(({ className, ...props }, ref) => {
    return <Flaticon ref={ref} name={iconName} className={className} {...props} />;
  });
  Comp.displayName = `Flaticon_${iconName}`;
  return Comp;
}

export const Coffee = createFlaticonWrapper("mug-hot-alt");
export const ChefHat = createFlaticonWrapper("hat-chef");
export const Bell = createFlaticonWrapper("bell");
export const BellOff = createFlaticonWrapper("bell-ring");
export const Printer = createFlaticonWrapper("print");
export const CheckCircle2 = createFlaticonWrapper("check-circle");
export const Clock = createFlaticonWrapper("time-fast");
export const ArrowRight = createFlaticonWrapper("arrow-right");
export const ArrowLeft = createFlaticonWrapper("arrow-left");
export const Search = createFlaticonWrapper("search");
export const Volume2 = createFlaticonWrapper("volume");
export const Utensils = createFlaticonWrapper("restaurant");
export const AlertCircle = createFlaticonWrapper("exclamation");
export const AlertTriangle = createFlaticonWrapper("exclamation");
export const ExternalLink = createFlaticonWrapper("share");
export const DollarSign = createFlaticonWrapper("money-bill-wave");
export const TrendingUp = createFlaticonWrapper("chart-histogram");
export const ShoppingBag = createFlaticonWrapper("shopping-bag");
export const Sparkles = createFlaticonWrapper("sparkles");
export const QrCode = createFlaticonWrapper("qrcode");
export const Store = createFlaticonWrapper("shop");
export const Download = createFlaticonWrapper("download");
export const XCircle = createFlaticonWrapper("cross-circle");
export const Check = createFlaticonWrapper("check");
export const Package = createFlaticonWrapper("box-alt");
export const Layers = createFlaticonWrapper("layers");
export const Calendar = createFlaticonWrapper("calendar");
export const X = createFlaticonWrapper("cross");
export const Plus = createFlaticonWrapper("plus");
export const Minus = createFlaticonWrapper("minus");
export const Trash2 = createFlaticonWrapper("trash");
export const User = createFlaticonWrapper("user");
export const Phone = createFlaticonWrapper("phone-call");
export const ShieldCheck = createFlaticonWrapper("shield-check");
export const Smartphone = createFlaticonWrapper("smartphone");
export const UtensilsCrossed = createFlaticonWrapper("restaurant");
export const Flame = createFlaticonWrapper("flame");
export const Receipt = createFlaticonWrapper("receipt");
export const Loader2 = createFlaticonWrapper("spinner");
export const Cookie = createFlaticonWrapper("cookie");

