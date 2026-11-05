import { Router } from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import requireAuth from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function validateTransaction(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Enter valid transaction details.";
  const { type, category, amount, description, date } = body;
  const parsedAmount = Number(amount);
  const parsedDate = new Date(date);
  if (!["income", "expense"].includes(type)) return "Choose income or expense.";
  if (typeof category !== "string" || !category.trim() || category.trim().length > 40) return "Enter a category (up to 40 characters).";
  if (!Number.isFinite(parsedAmount) || parsedAmount < 0.01 || parsedAmount > 100000000) return "Enter an amount between 0.01 and 100,000,000.";
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) return "Enter a valid transaction date.";
  if (description !== undefined && (typeof description !== "string" || description.trim().length > 120)) return "Notes must be 120 characters or fewer.";
  return null;
}

function transactionFields(body) {
  return {
    type: body.type,
    category: body.category.trim(),
    amount: Number(body.amount),
    description: typeof body.description === "string" ? body.description.trim() : "",
    date: new Date(`${body.date}T12:00:00.000Z`),
  };
}

router.get("/", async (request, response, next) => {
  try {
    const transactions = await Transaction.find({ user: request.userId }).sort({ date: -1, createdAt: -1 }).lean();
    return response.json({ transactions });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (request, response, next) => {
  try {
    const validationError = validateTransaction(request.body);
    if (validationError) return response.status(400).json({ message: validationError });
    const transaction = await Transaction.create({ ...transactionFields(request.body), user: request.userId });
    return response.status(201).json({ transaction });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: "Invalid transaction ID." });
    const validationError = validateTransaction(request.body);
    if (validationError) return response.status(400).json({ message: validationError });
    const transaction = await Transaction.findOneAndUpdate(
      { _id: request.params.id, user: request.userId },
      transactionFields(request.body),
      { new: true, runValidators: true },
    );
    if (!transaction) return response.status(404).json({ message: "Transaction not found." });
    return response.json({ transaction });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: "Invalid transaction ID." });
    const transaction = await Transaction.findOneAndDelete({ _id: request.params.id, user: request.userId });
    if (!transaction) return response.status(404).json({ message: "Transaction not found." });
    return response.json({ message: "Transaction deleted." });
  } catch (error) {
    return next(error);
  }
});

export default router;
