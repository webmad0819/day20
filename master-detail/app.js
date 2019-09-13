require("dotenv").config();

const express = require("express");
const hbs = require("hbs");
const mongoose = require("mongoose");
const Movies = require("./models/Movies");
const Directors = require("./models/Directors");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose
  .connect("mongodb://localhost/webmad0819", { useNewUrlParser: true })
  .then(x => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch(err => {
    console.error("Error connecting to mongo", err);
  });

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.get("/", (req, res) => {
  res.redirect("/master");
});

// get all movies in the chosen sort order (asc or desc)
app.get("/master/:sortOrder?", (req, res) => {
  // if (req.params.sortOrder)
  if (
    req.params.sortOrder === undefined ||
    (req.params.sortOrder !== "asc" && req.params.sortOrder !== "desc")
  ) {
    Movies.find()
      .select({ title: 1, year: 1 })
      .then(allMovies => {
        res.render("index", {
          nMovies: allMovies.length,
          allMovies,
          creator: process.env.MY_CREATOR,
          host: process.env.HOST
        });
      });
  } else {
    if (req.params.sortOrder === "asc") {
      Movies.find()
        .select({ title: 1, year: 1 })
        .sort({ year: 1 })
        .then(allMovies => {
          res.render("index", {
            allMovies,
            creator: process.env.MY_CREATOR,
            host: process.env.HOST
          });
        });
    }

    if (req.params.sortOrder === "desc") {
      Movies.find()
        .select({ title: 1, year: 1 })
        .sort({ year: -1 })
        .then(allMovies => {
          res.render("index", {
            allMovies,
            creator: process.env.MY_CREATOR,
            host: process.env.HOST
          });
        });
    }
  }
});

// get a specific movie
app.get("/movie/:id", (req, res) => {
  Movies.findById(req.params.id).then(oneMovie => {
    res.render("movie-detail", { oneMovie, host: process.env.HOST });
  });
});

// app.get("/:githubRepo", (req, res) => {
//   res.send(`rendering the ${req.params.githubRepo} repo`)
// })

// search one specific movie by ?movie=<movieID>
app.get("/search", (req, res) => {
  Movies.find({ title: req.query.movie }).then(movieDetails => {
    res.render("form-page-2", { query: movieDetails });
  });
});

// get a form page
app.get("/form", (req, res) => {
  res.render("form-page");
});

// query get with multi-params
app.get("/users/:username/books/:bookId", (req, res, next) => {
  res.send(req.params.username + "    " + req.params.bookId);
});

// http://localhost:5000/movie-querystring?identificadorPeli=5d7775a51be232a0c7086e20&genres=Drama,Crime
app.get("/movie-querystring", (req, res) => {
  Movies.find({ genre: { $all: req.query.genres.split(",") } })
    .then(oneMovie => {
      res.json(oneMovie);
    })
    .catch(error => {
      res.json({ movieNotFound: true, error });
    });
});

// create a new movie, displaying in a select the directors
app.get("/create-movie", (req, res) => {
  Directors.find().then(directors => {
    res.render("add-movie", { directors: directors });
  });
});

// create a new movie with its director
app.post("/create-movie-2", (req, res) => {
  Movies.create({
    title: req.body.title,
    year: req.body.year,
    rate: req.body.rate,
    director: req.body.director,
    duration: req.body.duration
  }).then(createdMovie => {
    console.log("crearted movie: ", createdMovie._id);
    Directors.findByIdAndUpdate(req.body.director, {
      $push: { movies: createdMovie._id }
    }).then(updatedDirector => {
      res.json({
        updatedDirector: updatedDirector,
        movieCreated: true,
        createdMovie
      });
    });
  });
});

// delete a movie
app.get("/movie/delete/:peliId", (req, res) => {
  Movies.findByIdAndDelete(req.params.peliId).then(deletedMovie => {
    res.redirect("/master");
  });
});

// add a test director
app.get("/add-director", (req, res) => {
  Directors.create({
    name: "Fernando Meirelles",
    movies: ["5d7775a51be232a0c7086d6e"]
  }, {
    name: "Christopher Noland",
    movies: ["5d7775a51be232a0c7086d70"]
  }).then(created => {
    res.json(created);
  });
});

// show all the directors. Comment and uncomment the '.populate("movies")' statement
// to unwrap the related movie ID using the mongo / mongoose populate capabilities
app.get("/show-directors", (req, res) => {
  Directors.find()
    .populate("movies")
    .then(directors => {
      // uncomment these lines should you want to transform the returned payload
      // as per Mr. Valderrama questions
      // directors = JSON.parse(JSON.stringify(directors));
      // directors[0].movies = directors[0].movies.map(movie => movie.title);

      // here we return the directors (with or without unwrapped movies with the populate)
      res.json(directors);
    });
});

// here we update a movie with the new data coming from the form
app.post("/movie-update", (req, res) => {
  Movies.findByIdAndUpdate(req.body._id, req.body).then(updatedMovie => {
    res.redirect(`/movie/${req.body._id}`);
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
