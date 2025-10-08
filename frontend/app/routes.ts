import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("designer", "routes/designer-new.tsx"),
  route("designer-old", "routes/designer.tsx"),
  route("designs", "routes/designs.tsx"),
  route("cart", "routes/cart.tsx"),
  route("orders", "routes/orders.tsx"),
] satisfies RouteConfig;
