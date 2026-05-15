const express = require("express");
const router = express.Router();
const c = require("../controllers/chatController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

router.post("/",                                  verifyToken, verifyAdmin, c.createChat);
router.get("/mine",                               verifyToken, c.getMineChats);
router.get("/debug",                              c.debugChats); // TEMPORARY
router.get("/:konteksType/:konteksId",            verifyToken, c.getChat);
router.post("/:chatId/message",                   verifyToken, c.sendMessage);
router.delete("/:chatId",                         verifyToken, verifyAdmin, c.deleteChat);

module.exports = router;
