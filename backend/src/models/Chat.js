const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  pengirim: { type: String, enum: ["admin", "mahasiswa"], required: true },
  isi:      { type: String, required: true },
  waktu:    { type: Date,   default: Date.now },
}, { _id: false });

const ChatSchema = new mongoose.Schema({
  chatId: {
    type: String, unique: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  konteksType: { type: String, enum: ["laporan", "claim"], required: true },
  konteksId:   { type: String, required: true },
  userId:      { type: String, required: true }, // student userId
  pesan:       [MessageSchema],
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Chat", ChatSchema);
