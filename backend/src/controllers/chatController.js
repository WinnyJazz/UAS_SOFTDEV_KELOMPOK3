const Chat = require("../models/Chat");

// POST /api/chat — Admin buat / lanjutkan chat
const createChat = async (req, res) => {
  try {
    const { konteksType, konteksId, userId, pesanAwal } = req.body;
    if (!pesanAwal?.trim()) return res.status(400).json({ success: false, message: "Pesan awal wajib diisi." });

    let chat = await Chat.findOne({ konteksType, konteksId });
    if (chat) {
      chat.pesan.push({ pengirim: "admin", isi: pesanAwal });
      await chat.save();
      return res.json({ success: true, data: chat });
    }

    chat = new Chat({ konteksType, konteksId, userId, pesan: [{ pengirim: "admin", isi: pesanAwal }] });
    await chat.save();
    res.status(201).json({ success: true, data: chat });
  } catch (err) {
    console.error("createChat:", err);
    res.status(500).json({ success: false, message: "Gagal membuat chat." });
  }
};

// GET /api/chat/mine — Student lihat semua chat aktif miliknya
const getMineChats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const Claim = require("../models/Claim");
    const Laporan = require("../models/Laporan");

    const myClaims = await Claim.find({ userId });
    const myLaporans = await Laporan.find({ userId });

    const claimIds = myClaims.map(c => c.claimId);
    const laporanIds = myLaporans.map(l => l.laporanId);

    const chats = await Chat.find({
      $or: [
        { konteksType: "claim", konteksId: { $in: claimIds } },
        { konteksType: "laporan", konteksId: { $in: laporanIds } },
        { userId: userId } // fallback
      ]
    });

    res.json({ success: true, data: chats });
  } catch (err) {
    console.error("getMineChats error:", err);
    res.status(500).json({ success: false });
  }
};

// GET /api/chat/:konteksType/:konteksId — Ambil chat spesifik
const getChat = async (req, res) => {
  try {
    const { konteksType, konteksId } = req.params;
    const chat = await Chat.findOne({ konteksType, konteksId });
    
    // Student hanya boleh lihat chat miliknya sendiri
    if (chat && req.user.role !== "admin" && req.user.role !== "superadmin") {
      let ownerId = chat.userId;
      if (konteksType === "claim") {
        const c = await require("../models/Claim").findOne({ claimId: konteksId });
        if (c) ownerId = c.userId;
      } else if (konteksType === "laporan") {
        const l = await require("../models/Laporan").findOne({ laporanId: konteksId });
        if (l) ownerId = l.userId;
      }

      if (ownerId !== req.user.userId)
        return res.status(403).json({ success: false, message: "Akses ditolak." });
    }
    res.json({ success: true, data: chat || null });
  } catch (err) {
    console.error("getChat error:", err);
    res.status(500).json({ success: false });
  }
};

// POST /api/chat/:chatId/message — Kirim pesan
const sendMessage = async (req, res) => {
  try {
    const { isi, pengirim } = req.body;
    if (!isi?.trim()) return res.status(400).json({ success: false, message: "Pesan kosong." });

    const chat = await Chat.findOne({ chatId: req.params.chatId });
    if (!chat) return res.status(404).json({ success: false, message: "Chat tidak ditemukan." });

    // Student hanya bisa reply ke chat miliknya
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      let ownerId = chat.userId;
      if (chat.konteksType === "claim") {
        const c = await require("../models/Claim").findOne({ claimId: chat.konteksId });
        if (c) ownerId = c.userId;
      } else if (chat.konteksType === "laporan") {
        const l = await require("../models/Laporan").findOne({ laporanId: chat.konteksId });
        if (l) ownerId = l.userId;
      }

      if (ownerId !== req.user.userId)
        return res.status(403).json({ success: false });
      if (pengirim !== "mahasiswa")
        return res.status(403).json({ success: false, message: "Role tidak sesuai." });
    }

    chat.pesan.push({ pengirim, isi });
    await chat.save();
    res.json({ success: true, data: chat });
  } catch (err) {
    console.error("sendMessage:", err);
    res.status(500).json({ success: false });
  }
};

// DELETE /api/chat/konteks/:konteksType/:konteksId — Hapus chat by konteks (internal)
const deleteChatByKonteks = async (konteksType, konteksId) => {
  try {
    await Chat.deleteMany({ konteksType, konteksId });
  } catch (err) {
    console.error("deleteChatByKonteks:", err);
  }
};

// DELETE /api/chat/:chatId — Admin hapus/tutup chat manual
const deleteChat = async (req, res) => {
  try {
    await Chat.findOneAndDelete({ chatId: req.params.chatId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// TEMPORARY: Debug chats
const debugChats = async (req, res) => {
  try {
    const chats = await Chat.find();
    res.json({ success: true, data: chats });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

module.exports = { createChat, getMineChats, getChat, sendMessage, deleteChat, deleteChatByKonteks, debugChats };
