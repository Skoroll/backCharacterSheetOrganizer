const express = require("express");
const router = express.Router();
const todoController = require("../controllers/toDoController");

// CRUD Routes
router.get("/", todoController.getTodos);
router.post("/", todoController.createTodo);
router.patch("/:id/", todoController.updateTodo);
router.delete("/:id", todoController.deleteTodo);

module.exports = router;
