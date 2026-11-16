if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

// Dependencies
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const path = require("path");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listingsRouter = require("./routes/listings.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const db_url = process.env.ATLAS_DB;
// Render provides PORT; fall back to 3000 locally
const port = process.env.PORT || 3000;

// DB Connection
async function main() {
  await mongoose.connect(db_url);
}
main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

const store = MongoStore.create({
  mongoUrl: db_url,
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("Error in Mongo Session Store: ", err);
});

// session options
const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

// middlewares
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));

// Safe defaults so templates (navbar etc.) never hit "currUser is not defined",
// even if an error happens before session/passport finish running.
app.use((req, res, next) => {
  res.locals.currUser = null;
  res.locals.success = [];
  res.locals.error = [];
  next();
});

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Real values, set as soon as session/passport are ready
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user || null;
  next();
});

// root link
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// routes
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  console.error(err);
  let { statusCode = 500, message = "Something went wrong!" } = err;
  if (res.headersSent) return next(err);
  res.status(statusCode).render("error.ejs", { message });
});

// server starter
app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
