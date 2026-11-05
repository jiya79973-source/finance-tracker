import jwt from "jsonwebtoken";

export default function requireAuth(request, response, next) {
  const authorization = request.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Please sign in to continue." });
  }

  try {
    const payload = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
    if (typeof payload !== "object" || typeof payload.sub !== "string") {
      return response.status(401).json({ message: "Your session is invalid. Please sign in again." });
    }
    request.userId = payload.sub;
    return next();
  } catch {
    return response.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}
