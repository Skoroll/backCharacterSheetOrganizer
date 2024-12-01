//middleware/preMiddleware.js
const User = require('./userModel');
const UserMadeTask = require('./userMadeTaskModel');

userSchema.pre('remove', async function (next) {
  await UserMadeTask.deleteMany({ user: this._id });
  next();
});
