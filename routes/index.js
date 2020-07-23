const express = require("express"),
  router = express.Router({ mergeParams: true }),
  passport = require("passport"),
  User = require("../models/user"),
  StockSearch = require("../models/stocksearch"),
  got = require("got"),
  Stock = require("../models/stock");
require("dotenv").config();

router.get("/test", async (req, res) => {
  const stocks = await StockNyse.find({});
  stocks.forEach( async (stock) => {
    const api_url = "https://financialmodelingprep.com/api/v3/historical-price-full/"+ stock.symbol + "?timeseries=30&apikey=" + process.env.API_KEY;
    const rawData = await got(api_url);
    const data = JSON.parse(rawData.body);
    if (Object.keys(data).length === 0) {
      await StockNyse.remove({symbol: stock.symbol});
      console.log(stock.symbol);
    }
  });
});

// root route
router.get("/", (req, res) => {
  res.render("landing");
});

// get search route
router.post("/search", (req, res) => {
  console.log('search', req.body.symbol);
  StockSearch.find({ symbol: { $regex: req.body.symbol } }, (err, foundStock) => {
    if (foundStock.length > 0) {
      res.json({ foundStock });
    } else {
      res.json ({ foundStock: null });
    }
  });
});

// get price route
router.post("/getStock", (req, res) => {
  console.log("getStock", req.body.symbol);
  Stock.findOne({ symbol: req.body.symbol.toUpperCase() }, (err, foundStock) => {
    if (foundStock == null) {
      res.json ({ foundStock: null });
    } else {
      res.json({ foundStock });
    }
  });
});

// router.post("/update", async (req, res) => {
//   console.log(req.body);
//   let query = req.body.query.split(",");
//   let response = await getStocks(query);
//   res.json(response);
// });

// function getStocks (query) {
//   return new Promise( async (resolve, reject) => {
//     var re = [];
//     for (i = 0; i < query.length; i ++){
//       var foundStock = await Stock.findOne({symbol: query[i]});
//       re.push(foundStock);
//       if (i === (query.length - 1)) {
//         resolve(re);
//       }
//     }
//   });
// }


// === AUTH ===
// show register form
router.get("/register", (req, res) => {
  res.render("register");
});

//handle sign up logic
router.post("/register", (req, res) => {
  let newUser = new User(req.body
    // username: req.body.username,
    // firstname: req.body.firstname,
    // lastname: req.body.lastname,
    // email: req.body.email,
    
  );
  // check unique valid user name here
  User.findOne({username: req.body.username}, (err, foundUser) => {
    if (!foundUser) {
      User.register(newUser, req.body.password, (err, user) => {
        // encode the password
        if (err) {
          console.log("error in register", err);
          req.flash("error", err.message);
          return res.render("register");
        }
        passport.authenticate("local")(req, res, () => {
          // log user in, serialize session
          req.flash("success", "Welcome to Stockoverflow " + user.firstname);
          res.redirect("/");
        });
      });
    } else {
      req.flash("error", "Username " + req.body.username + " already exists, please choose a different one." );
      res.redirect("back");
    }
  })
});

// show login form
router.get("/login", (req, res) => {
  res.render("login");
});

// handling login logic
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

// logout route
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "Logged you out!");
  res.redirect("/");
});

router.get("*", function (req, res) {
  res.status(404).render("errorpage");
});

module.exports = router;
