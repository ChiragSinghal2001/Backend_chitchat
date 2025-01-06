const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../authMiddleware");

module.exports.check=()=>{
  console.log("Success")
}

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user){
    console.log("user not found");
      return res.json({ msg: "Incorrect Username or Password", status: false });}
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid){
      return res.json({ msg: "Incorrect Username or Password", status: false });}
      
      const savedUser = user.toObject();
    delete savedUser.password;

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const start = Date.now();
    res.cookie("auth_token", token, {
      // httpOnly: true,
      // secure: false,
      sameSite: "none", 
      maxAge: 60 * 60 * 1000, // 1 hour
    });
    console.log("Cookie set in:", Date.now() - start, "ms");
    return res.json({ status: true, savedUser });
  } catch (ex) {
    next(ex);
  }
};

module.exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    console.log("username, email, password", username, email, password);
    const usernameCheck = await User.findOne({ username });
    if (usernameCheck)
      return res.json({ msg: "Username already used", status: false });
    const emailCheck = await User.findOne({ email });
    if (emailCheck)
      return res.json({ msg: "Email already used", status: false });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
    });

    console.log("user id: ", user._id);
    const savedUser = user.toObject();
    delete savedUser.password;

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "10h" });


    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: false,
      // secure: process.env.NODE_ENV === "production", 
      // sameSite: "strict",
      sameSite: "none", 
      maxAge: 10*60 * 60 * 1000, // 10 hour
    });

    return res.json({ status: true, savedUser });
  } catch (ex) {
    next(ex);
  }
};

module.exports.getAllUsers = [verifyToken, async (req, res, next) => {
  console.log("req.user", req.user);
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select([
      "email",
      "username",
      "avatarImage",
      "_id",
    ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
}];
// need to check how we get id using params
module.exports.setAvatar = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const avatarImage = req.body.image;
    const userData = await User.findByIdAndUpdate(
      userId,
      {
        isAvatarImageSet: true,
        avatarImage,
      },
      { new: true }
    );
    return res.json({
      isSet: userData.isAvatarImageSet,
      image: userData.avatarImage,
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.logOut = (req, res, next) => {
  try {
    if (!req.params.id) return res.json({ msg: "User id is required " });
    onlineUsers.delete(req.params.id);
    return res.status(200).send();
  } catch (ex) {
    next(ex);
  }
};
