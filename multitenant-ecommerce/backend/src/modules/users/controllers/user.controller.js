const User = require("../../../models/User");
const { hashPassword } = require("../../auth/services/password");
const { isUnderLimit } = require("../../../config/plans");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

/**
 * Admin user management (store staff). The store OWNER manages the ADMIN users
 * of their OWN tenant. All queries are tenant-scoped by the plugin.
 *
 * Simple model: every managed user is an 'admin' (full panel access). Plan
 * limits cap how many admins a tenant can have (adminUsers in config/plans).
 *
 * Only the owner (isOwner) can create/delete users. Employees (regular admins)
 * can't manage anyone — this prevents an employee from removing the owner or
 * other staff.
 */

// Used by the enforceLimit middleware to count current admin users for the tenant.
exports.countUsers = async () => User.countDocuments();

// GET /users  -> list the tenant's admin users
exports.listUsers = catchAsync(async (req, res) => {
  const users = await User.find({ role: "admin" }).sort({ createdAt: -1 });
  // Never expose password hashes (they're select:false anyway, but be explicit).
  const safe = users.map((u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    isOwner: Boolean(u.isOwner),
    createdAt: u.createdAt,
  }));
  res.json({ status: "success", total: safe.length, users: safe });
});

// POST /users  -> create a new admin user in this tenant (respects plan limit)
exports.createUser = catchAsync(async (req, res, next) => {
  // Only the store owner can manage users.
  if (!req.user?.isOwner) {
    return next(new AppError("Only the store owner can manage users.", 403));
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError("Name, email and password are required.", 400));
  }
  if (password.length < 8) {
    return next(new AppError("Password must be at least 8 characters.", 400));
  }

  // Enforce the plan's admin-user limit.
  const currentCount = await User.countDocuments({ role: "admin" });
  if (!isUnderLimit(req.tenant.plan, "adminUsers", currentCount)) {
    return next(
      new AppError(
        "You reached your plan limit for admin users. Upgrade to add more.",
        403,
      ),
    );
  }

  const hashed = await hashPassword(password);

  let user;
  try {
    user = await User.create({
      name,
      email,
      password: hashed,
      role: "admin",
      tenantId: req.tenant._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError("A user with that email already exists.", 409));
    }
    throw err;
  }

  res.status(201).json({
    status: "success",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

// DELETE /users/:id  -> remove an admin user
//   - only the owner can delete users
//   - can't delete yourself (lockout protection)
//   - can't delete the store owner (protected from everyone)
//   - can't delete the last admin (a store must always have at least one)
exports.deleteUser = catchAsync(async (req, res, next) => {
  // Only the store owner can manage users.
  if (!req.user?.isOwner) {
    return next(new AppError("Only the store owner can manage users.", 403));
  }

  // Prevent deleting your own account.
  if (req.user && req.user._id.toString() === req.params.id) {
    return next(new AppError("You can't delete your own account.", 400));
  }

  // Find the target first to check if it's the owner.
  const target = await User.findOne({ _id: req.params.id, role: "admin" });
  if (!target) return next(new AppError("User not found", 404));

  // The store owner can never be removed.
  if (target.isOwner) {
    return next(new AppError("The store owner can't be removed.", 403));
  }

  // A store must always keep at least one admin.
  const adminCount = await User.countDocuments({ role: "admin" });
  if (adminCount <= 1) {
    return next(new AppError("A store must have at least one admin.", 400));
  }

  await User.deleteOne({ _id: target._id });
  res.json({ status: "success" });
});
