const mongoose = require("mongoose");
const Chat = require("./src/models/Chat");
const Claim = require("./src/models/Claim");

require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const chats = await Chat.find();
  console.log("All Chats:", JSON.stringify(chats, null, 2));
  
  const claims = await Claim.find();
  console.log("All Claims:");
  claims.forEach(c => console.log(c.claimId, " userId:", c.userId));

  mongoose.connection.close();
});
