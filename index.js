const express = require('express');
const path = require('path');
const passport = require('passport');
const passportLocal = require('passport-local');
const { Sequelize, DataTypes, UUID, UUIDV4 } = require('sequelize');
const port = process.env.port || 3000;
const bcrypt = require('bcrypt');
const sequelize = new Sequelize(
  'postgres://postgres:seMEolvido11@127.0.0.1:5432/passport'
);
const session = require('express-session');
const methodOverride = require('method-override');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({ secret: 'Secret session', saveUninitialized: false, resave: false })
);
app.use(methodOverride('_method'));
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new passportLocal(async (username, passsword, done) => {
    const user = await User.findOne({ where: { username: username } });
    /*     if (!user) {
            console.log('usuario no encontrado');
            return done(null, false);
        }
        if (user.dataValues.password !== passsword) {
            //console.log(hash);
            console.log('Mal contraseña')
            return done(null, false)
        }
        return done(null, user) */

    //CON BCRYPT
    if (!user) {
      return done(null, false);
    }
    await bcrypt.compare(passsword, user.dataValues.password, (err, result) => {
      if (result) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  done(null, id);
});

const User = sequelize.define(
  'userpp',
  {
    id: {
      type: UUID,
      defaultValue: UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
  },
  {
    freezeTableName: true,
  }
);

const isAutehticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('login');
};

const isNotAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('secret');
};

//To create database and table with all columns RUN FIRST

app.get('/sync', async (req, res) => {
  const user = await sequelize.sync({ force: true });
  console.log(user);
  res.send('hecho');
});

app.get('/secret', isAutehticated, async (req, res, next) => {
  console.log(req.user);
  res.render('secret');
});

app.get('/login', isNotAuthenticated, (req, res, next) => {
  res.render('login');
});

app.post('/login', passport.authenticate('local'), async (req, res, next) => {
  res.redirect('/secret');
});

app.get('/register', isNotAuthenticated, (req, res, next) => {
  res.render('register');
});

app.post('/register', async (req, res, next) => {
  const { username, password } = req.body;
  //const salt = bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, 12);
  console.log(hash);
  const createdUser = await User.create({ username: username, password: hash });
  req.login(createdUser, (err) => {
    if (err) {
      return next(err);
    }
    return res.redirect('/secret');
  });
});

/* app.get('/bcrypt', (req, res, next) => {
    res.render('bcrypt');
});

app.post('/bcrypt', async (req, res, next) => {
    const { username, password } = req.body;
    const findUser = await User.findOne({ where: { username: username } });
    if (!findUser) {
        return res.send('Usuario no encontrado');
    }
    const findUserPass = findUser.dataValues.password;
    await bcrypt.compare(password, findUserPass, (err, result) => {
        if (result) {
            res.send('LOGEADO');
        } else {
            res.send('MAL');
        }
    })
}); */

app.delete('/logout', async (req, res, next) => {
  req.logOut();
  res.redirect('login');
});

app.listen(port, () => {
  console.log(`Running at port: ${port}`);
});
