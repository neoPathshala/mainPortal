// ═══════════════════════════════════════════════════════════════════════════════
// neoPathshala Pro Plans & Orders Configuration
// Matches exact pricing, features, and checkout models from screenshots
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  durationLabel: string;
  features: string[];
  ctaLabel: string;
  badge?: string;
}

export interface UserOrder {
  orderId: string;
  planId: string;
  planName: string;
  price: number;
  durationDays: number;
  userName: string;
  userEmail: string;
  status: "Waiting for your payment" | "Payment Under Review" | "Active Pro" | "Cancelled";
  transactionId?: string;
  createdAt: string;
}

export const PRO_PLANS: ProPlan[] = [
  {
    id: "weekly",
    name: "Weekly",
    price: 10,
    durationDays: 7,
    durationLabel: "for 7 days",
    features: [
      "Voice notes: short audio explanations for your subjects",
      "Premium notes: complete, well-organized notes by toppers and teachers",
      "Every Pro document: Pro notes, resources and past questions open in full",
      "No ads: study without advertisements",
      "All subjects and semesters included",
      "Access ends on the expiry date, with no auto-renewal",
      "Try Pro for a week",
    ],
    ctaLabel: "Choose Weekly",
  },
  {
    id: "monthly",
    name: "Monthly",
    price: 30,
    durationDays: 30,
    durationLabel: "for 30 days",
    features: [
      "Voice notes: short audio explanations for your subjects",
      "Premium notes: complete, well-organized notes by toppers and teachers",
      "Every Pro document: Pro notes, resources and past questions open in full",
      "No ads: study without advertisements",
      "All subjects and semesters included",
      "Access ends on the expiry date, with no auto-renewal",
      "Flexible monthly study",
    ],
    ctaLabel: "Choose Monthly",
  },
  {
    id: "exam-pass",
    name: "Exam Pass",
    price: 40,
    durationDays: 45,
    durationLabel: "for 45 days",
    features: [
      "Voice notes: short audio explanations for your subjects",
      "Premium notes: complete, well-organized notes by toppers and teachers",
      "Every Pro document: Pro notes, resources and past questions open in full",
      "No ads: study without advertisements",
      "All subjects and semesters included",
      "Access ends on the expiry date, with no auto-renewal",
      "Ready for your exams",
    ],
    ctaLabel: "Choose Exam Pass",
  },
  {
    id: "6-months",
    name: "6 Months",
    price: 60,
    durationDays: 180,
    durationLabel: "for 180 days",
    features: [
      "Voice notes: short audio explanations for your subjects",
      "Premium notes: complete, well-organized notes by toppers and teachers",
      "Every Pro document: Pro notes, resources and past questions open in full",
      "No ads: study without advertisements",
      "All subjects and semesters included",
      "Access ends on the expiry date, with no auto-renewal",
      "A full semester and more",
    ],
    ctaLabel: "Choose 6 Months",
  },
  {
    id: "yearly",
    name: "Yearly",
    price: 100,
    durationDays: 365,
    durationLabel: "for 365 days",
    features: [
      "Voice notes: short audio explanations for your subjects",
      "Premium notes: complete, well-organized notes by toppers and teachers",
      "Every Pro document: Pro notes, resources and past questions open in full",
      "No ads: study without advertisements",
      "All subjects and semesters included",
      "Access ends on the expiry date, with no auto-renewal",
      "Best value. Just Rs 100 for the whole year",
    ],
    ctaLabel: "Choose Yearly",
  },
];

export function generateOrderNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomCode = "";
  for (let i = 0; i < 5; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HS-261020-${randomCode}`;
}

export function getStoredOrders(): UserOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("neopathshala_user_orders");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item.orderId === "string" && /^[A-Z0-9-]{5,60}$/.test(item.orderId) && typeof item.planName === "string" && typeof item.userEmail === "string" && typeof item.price === "number" && Number.isFinite(item.price));
    }
  } catch {}
  return [];
}

export function saveStoredOrder(order: UserOrder): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredOrders();
    const idx = current.findIndex((o) => o.orderId === order.orderId);
    let updated: UserOrder[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = order;
    } else {
      updated = [order, ...current];
    }
    localStorage.setItem("neopathshala_user_orders", JSON.stringify(updated));
  } catch {}
}
